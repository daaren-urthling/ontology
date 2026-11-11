import metadata from './metadata.js';
import createModuleOntology from './module.js';
import path from 'node:path';
import { error } from './notifications.js';
import fs from 'node:fs';
import _ from 'lodash';
// import markdown from './markdown.js';
import fsStuff from './fs-stuff.js';

export default function createAppOntology(app, workingPath, outputPath) {
    process.chdir(path.join(workingPath, app.name));
    _.assignIn(app, metadata.parseXML('Application.config'));
    var moduleNames = metadata.scanFor('Module.config');
    app.modules = [];
    var appOutputPath = path.join(outputPath, `${app.name}Ontology`);
    fsStuff.rimraf(appOutputPath);
    fs.mkdirSync(appOutputPath);
    moduleNames.forEach(moduleName => {
        var mod = { name: moduleName, appName: app.name };
        if (createModuleOntology(mod, path.join(workingPath, app.name), appOutputPath)) {
            app.modules.push(mod);
        }
    });
    // if (!metadata.defined(app.localize)) {
    //     app.localize = `${app.name} Application`;
    // }
    // if (app.modules.length > 0) {
    //     console.log(`${app.name}:`);
    //     createHelpFile(appOutputPath, app);
    //     console.log(moduleNames);
    //     return true;
    // } else {
    //     fsStuff.rimraf(appOutputPath);
    // }
    return false;
}


//-----------------------------------------------------------------------------
// function createHelpFile(appOutputPath, app) {
//     var content = `[H1]${app.localize}\nHere the **${app.localize}** modules:\n\n`;

//     var gridContent = [["Module name / folder", "Description"]];
//     app.modules.forEach(module => {
//         gridContent.push([`[LINK ${app.name}-${module.name} ${module.name}]`, markdown.adjust(module.localize)]);
//     });
//     content += markdown.gridRender(gridContent);

//     app.modules.forEach(module => {
//         content += `[INCLUDE ${module.name}.sam]\n`;
//     });
    
//     try {
//         fs.writeFileSync(path.join(appOutputPath, `${app.name}.sam`), content);
//     } catch (err) {
//         error(err);
//     }
// }

