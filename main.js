#!/usr/bin/env node
import chalk from 'chalk';
import _ from 'lodash';
import path from 'node:path';
import fs from 'node:fs';
import metadata from './metadata.js';
import createAppOntology from './application.js';
import error from './error.js';

console.log(chalk.bold('Welcome to the Mago Ontology generator'));

var workingPath = null;
const cmdArgs = process.argv.slice(2);

if (cmdArgs.length < 1) {
    error("Usage: ontology <output> [input path]\nAt least the output path must be specified.");
}
var outputPath = cmdArgs[0];
if (!fs.existsSync(outputPath)) {
    error(`The output path ${outputPath} does not exists.`)
}

if (cmdArgs.length < 2) {
    workingPath = process.cwd();
} else {
    workingPath = cmdArgs[1];
}

var isStandard = _.toLower(workingPath).endsWith('\\standard\\applications');

if (!isStandard) {
    error("Usage: ontology <output> [input path]\n'input path' argument or current folder must be inside the 'Standard' folder of a TaskBuilder Application\ne.g.: <your instance>\\Standard\\Applications\\<your app>");
}

process.chdir(workingPath);
var appNames = metadata.scanFor('Application.config');
console.log(appNames);
var apps = [];
appNames.forEach(appName => {
    var app = {name: appName};
    if (createAppOntology(app, workingPath, outputPath)) {
        apps.push(app);
    }
});
