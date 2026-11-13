import metadata from './metadata.js';
import createModuleOntology from './module.js';
import path from 'node:path';
import _ from 'lodash';
import { options, prune } from './commonOptions.js';
import fs from 'node:fs';

export default function createAppOntology(app, workingPath, outputPath) {
    process.chdir(path.join(workingPath, app.name));
    _.assignIn(app, metadata.parseXML('Application.config'));
    var moduleNames = metadata.scanFor('Module.config');
    moduleNames = prune(moduleNames, options.modules, "Module");
    
    app.modules = [];
    var appOutputPath = path.join(outputPath, `${app.name}`);
    fs.mkdirSync(appOutputPath);

    moduleNames.forEach(moduleName => {
        var mod = { name: moduleName, appName: app.name };
        if (createModuleOntology(mod, path.join(workingPath, app.name), appOutputPath)) {
            app.modules.push(mod);
        }
    });

    return true;
}


