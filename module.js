import metadata from './metadata.js';
import _ from 'lodash';
import path from 'node:path';
import fs from 'node:fs';
// import markdown from './markdown.js';
import { error, warning } from './notifications.js';
import RDF from './RDF.js'

export default function createModuleOntology(module, workingPath, outputPath) {
    process.chdir(path.join(workingPath, module.name));
    _.assignIn(module, metadata.parseXML('Module.config'));
    if (!metadata.defined(module.localize)) {
        module.localize = "N/A";
        warning(`Missing description for module ${module.name} of application ${module.appName}`);
    }
    var docsMetadata = path.join('ModuleObjects', 'DocumentObjects.xml');
    if (!fs.existsSync(docsMetadata)) {
        warning(`Module ${module.name} of application ${module.appName} has no documents defined`);
        return false;
    }

    var documentObjects = metadata.parseXML(docsMetadata);
    documentObjects = metadata.normalize(documentObjects.Documents, "Document");

    if (documentObjects.length === 0) {
        warning(`Module ${module.name} of application ${module.appName} has no documents defined`);
        return false;
    }

    module.documents = [];
    documentObjects.forEach(doc => {
        if (!metadata.isBatch(doc.ViewModes)) {
            getDocumentMetadata(doc);
            createDocumentOntology(outputPath, doc);
            module.documents.push(doc);
        }
    });

    return true;
}

function getDocumentMetadata(doc) {
    var dbtsFName = path.join("ModuleObjects", `${metadata.objectName(doc.namespace)}`, "Description", "Dbts.xml" );
    if (!fs.existsSync(dbtsFName)) {
        warning(`Document ${doc.namespace} has no DBTs defined`);
        return;
    }

    var dbts = metadata.parseXML(dbtsFName);

    if (!metadata.defined(dbts.Master)) {
        warning(`Document ${doc.namespace} has no Master DBT defined`);
        return;
    }
    doc.DBTMaster = dbts.Master;
    doc.DBTMaster.Slave = [];
    doc.DBTMaster.SlaveBuffered = [];
    if (metadata.defined(dbts.Master.Slaves)) {
        doc.DBTMaster.Slave = metadata.normalize(dbts.Master.Slaves, "Slave");
        doc.DBTMaster.SlaveBuffered = metadata.normalize(dbts.Master.Slaves, "SlaveBuffered");
    }
    delete doc.DBTMaster.Slaves;
}

// docURI = contacts
// docName = Contacts
// docNamespace = ERP.Contacts.Documents.Contacts
function createDocumentOntology(outputPath, doc) {
    if (!metadata.defined(doc.DBTMaster) ) return; // TODO gestire batch e simili
    var docName = RDF.docName(doc);
    var docURI = RDF.docURI(doc);    
    
    var content = `
    ${RDF.prefixes}
@prefix ${docURI}:  <https://www.microarea.it/ontology/${docURI}#> .

<https://www.microarea.it/ontology/${docURI}>
    a owl:Ontology ;
    owl:imports <https://www.microarea.it/ontology/core> .

${docURI}:${docName}
    a mago:Document ;
    mago:namespace "${doc.namespace}" ;
    mago:hasDBTMaster ${docURI}:${RDF.dbtName(docName, doc.DBTMaster)} .

${docURI}:${RDF.dbtName(docName, doc.DBTMaster)}
    a mago:DBTMaster ;
    mago:namespace "${doc.DBTMaster.namespace}" `;

    if (doc.DBTMaster.Slave.length > 0 || doc.DBTMaster.SlaveBuffered.length > 0) {
        content += ` ;
    mago:hasDBTSlave
        `;
        doc.DBTMaster.Slave.forEach( slave => {
        content += `${docURI}:${RDF.dbtName(docName, slave)} ,
        `
        })
        doc.DBTMaster.SlaveBuffered.forEach( slave => {
        content += `${docURI}:${RDF.dbtName(docName, slave)} ,
        `
        });
        
        content = RDF.replaceDandlingComma(content);
    } else {
        content += ".\n"
    }

    doc.DBTMaster.Slave.forEach( slave => {
        content += `
${docURI}:${RDF.dbtName(docName, slave)} 
    a mago:DBTSlave ;
    mago:namespace "${slave.namespace}" .
    `
    })

    doc.DBTMaster.SlaveBuffered.forEach( slave => {
        content += `
${docURI}:${RDF.dbtName(docName, slave)} 
    a mago:DBTSlaveBuffered ;
    mago:namespace "${slave.namespace}" .
    `
    })

    try {
        fs.writeFileSync(path.join(outputPath, `${docName}.ttl`), content);
    } catch (err) {
        error(err);
    }
}

//#region old code

function createHelpFile(outputPath, module) {
    var content = `[H2 ${module.appName}-${module.name}]${module.localize}\nHere the **${module.localize}** tables:\n\n`;

    var gridContent = [["Table name", "Description"]];
    module.dbObjects.Tables.Table.forEach(table => {
        if (!metadata.defined(table.localize)) table.localize = "";
        gridContent.push(
                            [`[LINK ${metadata.dashed(metadata.compact(table.namespace))} ${metadata.objectName(table.namespace)}]`, 
                            markdown.adjust(table.localize)]
                        );
    });
    content += markdown.gridRender(gridContent);

    module.dbObjects.Tables.Table.forEach(table => {
        content += createTableDescription(table);
    });
    try {
        fs.writeFileSync(path.join(outputPath, `${module.name}.sam`), content);
    } catch (err) {
        error(err);
    }
}

function createTableDescription(table) {
    var content = `[H3 ${metadata.dashed(metadata.compact(table.namespace))}]${metadata.objectName(table.namespace)}\n`;

    content += "[H4] Base Info\n";

    var gridContent = [
        ["Phisical Name",           metadata.objectName(table.namespace)],
        ["Content",                 markdown.adjust(table.localize)],
        ["Part of the document",    partOfDocument(table.Document, metadata.appName(table.namespace))]
    ];
    if (metadata.defined(table.Reference) && table.Reference != '') {
        gridContent.push(
            ["References",          `[LINK ${metadata.dashed(metadata.compact(table.Reference))} ${table.namespace}]`]
        );
    }
    content += markdown.gridRender(gridContent, { allLines: true });

    content += "[H4] Overview\n";
    if (!metadata.defined(table.DocumentationInfo.content)) table.DocumentationInfo.content = "";
    content += `${markdown.adjust(table.DocumentationInfo.content)}\n`;

    content += "[H4] Fields\n";
    if (metadata.isArray(table.Columns)) {
        gridContent = [["Name", "Type & Len", "M", "R/O", "D", "Description"]];
        table.Columns.Column.forEach(column => {
            gridContent.push([
                hotlink(column, metadata.appName(table.namespace)), 
                columnType(column), 
                markdown.asCheck(column.DocumentationInfo.mandatory), 
                markdown.asCheck(column.DocumentationInfo.readonly), 
                defaultValue(column), 
                markdown.adjust(column.DocumentationInfo.content) 
            ])
        });
        content += markdown.gridRender(gridContent, { allLines: true });
    } else {
        content += "N/A\n";
        console.log(`${table.namespace} has no column defined`);
    }

    return content;
}

//-----------------------------------------------------------------------------
function mergeDBInfoData(dbObjects) {
    dbObjects.Tables.Table.forEach(table => {
        var dbinfoFName = path.join("ModuleObjects", "DBInfo",  `${metadata.objectName(table.namespace)}.xml`);
        if (!fs.existsSync(dbinfoFName)) {
            return;
        }
        var dbInfoData = metadata.parseXML(dbinfoFName);
        if (metadata.defined(dbInfoData.localize)) table.localize = dbInfoData.localize;
        if (metadata.defined(dbInfoData.Reference)) table.Reference = dbInfoData.Reference;
        if (metadata.defined(dbInfoData.Document)) table.Document = dbInfoData.Document;

        if (metadata.isArray(table.Columns)) {
            table.Columns.Column.forEach(column => {
                var colInfo = lookup(column.SchemaInfo.content, dbInfoData);
                if (metadata.defined(colInfo.Reference) && colInfo.Reference != "") 
                    column.Reference = colInfo.Reference;
            });
        }
    });
}

//-----------------------------------------------------------------------------
function partOfDocument(documentList, appName) {
    if (!metadata.defined(documentList) || documentList == "") {
        return "N/A";
    }
    var documents = documentList.split(",");
    var output="";
    documents.forEach(document => {
        if (document.includes('/')) {
            output += `${appName}.${document.split('/')[0]}.${document.split('/')[1]}[BR]`;
        } else {
            output += `${metadata.compact(document)}[BR]`;
        }
    });

    return output;
}

//-----------------------------------------------------------------------------
function columnType(column) {
    if (column.SchemaInfo.type == "String") {
        return `String ${column.SchemaInfo.length}`;
    } else if (column.SchemaInfo.type == "Enum") {
        return column.SchemaInfo.enumname;
    }
    return column.SchemaInfo.type;
}

//-----------------------------------------------------------------------------
function defaultValue(column) {
    if (column.SchemaInfo.type == "Date" || column.SchemaInfo.type == "DateTime" ) {
        if (column.SchemaInfo.defaultvalue == "1799-12-31T00:00:00") return "empty";
    }
    return column.SchemaInfo.defaultvalue;
}

//-----------------------------------------------------------------------------
function lookup(columnName, dbInfo) {
    if (!metadata.isArray(dbInfo.Fields)) return {};
    var colInfo = {};
    dbInfo.Fields.Column.every(column => {
        if (column.Name == columnName) {
            colInfo = column;
            return false;
        }
        return true;
    });

    return colInfo;
}

//-----------------------------------------------------------------------------
function hotlink(column, appName) {
    if (metadata.defined(column.Reference)) {
        if (column.Reference.includes('/')) {
            return `[LINK ${appName}-${column.Reference.split('/')[0]}-${column.Reference.split('/')[1]} ${column.SchemaInfo.content}]`;
        }
        return `[LINK ${metadata.dashed(metadata.compact(column.Reference))} ${column.SchemaInfo.content}]`;
    }
    return column.SchemaInfo.content;
}

//#endregion