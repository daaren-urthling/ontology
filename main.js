#!/usr/bin/env node

import _ from 'lodash';
import fs from 'node:fs';
import metadata from './metadata.js';
import createAppOntology from './application.js';
import { error, info } from './notifications.js';
import { options } from './commonOptions.js'

info('Welcome to the Mago Ontology generator');

if (options.input == "" || options.output == "") {
    error("Usage: ontology --input <input path> --output <output path>");
}

if (!fs.existsSync(options.output)) {
    error(`The output path ${options.output} does not exists.`)
}

if (!fs.existsSync(options.input)) {
    error(`The input path ${options.input} does not exists.`)
}

if (!_.toLower(options.input).endsWith('\\standard\\applications')) {
    error(`Input path ${options.input} must be inside the 'Standard' folder of a TaskBuilder Application\ne.g.: <your instance>\\Standard\\Applications\\<your app>`);
}

process.chdir(options.input);
var appNames = metadata.scanFor('Application.config');
if (options.apps.length > 0) {
    options.apps.forEach(app => {
        if (!appNames.includes(app))
            error(`Application ${app} does not exist`)
    });
    appNames = options.apps;
}

if  (
        (options.apps.length === 0 && options.modules.length > 0) ||
        (options.apps.length > 1 && options.modules.length > 0)
    ) {
    error("Module list is allowed only when a single application is specified\ne.g.: --apps ABC --modules XYZ JKL ")
}

info('Applications:')
console.log(appNames);
var apps = [];
appNames.forEach(appName => {
    var app = {name: appName};
    if (createAppOntology(app, options.input, options.output)) {
        apps.push(app);
    }
});
