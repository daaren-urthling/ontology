import metadata from './metadata.js';
import _ from 'lodash';

const prefixes = 
`
@prefix rdf:  <http://www.w3.org/1999/02/22-rdf-syntax-ns#> .
@prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#> .
@prefix owl:  <http://www.w3.org/2002/07/owl#> .
@prefix xsd:  <http://www.w3.org/2001/XMLSchema#> .

@prefix mago: <https://www.microarea.it/ontology#> .
`

function dbtName(docName, dbt) {
    return `${docName}_${metadata.objectName(dbt.namespace)}`
}

function docName(doc) {
    return metadata.objectName(doc.namespace);   
}

function docURI(doc) {
    return _.toLower(metadata.objectName(doc.namespace));   
}

function replaceDandlingComma(content) {
    // turn last "," into "."
     return content.replace(/,([^,]*)$/, ".$1");
}

function replaceLastWith(content, original, substitute) {
    const pos = content.lastIndexOf(original);

    if (pos !== -1) {
        content = content.substring(0, pos) + substitute + content.substring(pos + original.length);
    }
    return content;
}

export default {
    prefixes,
    dbtName,
    docURI,
    docName,
    replaceDandlingComma,
    replaceLastWith
}