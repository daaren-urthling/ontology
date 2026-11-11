import { error } from './notifications.js';
import path from 'node:path';
import fs from 'node:fs';
import { globSync } from 'glob';
import xml2js from 'xml2js';
import _ from 'lodash';
import fsStuff from './fs-stuff.js'

function scanFor(markerFile) {
    var folders = [];
    globSync(fsStuff.path_join('*', markerFile), { nocase: true }).forEach(folder => {
        folders.push(path.dirname(folder));
    });
    return folders;
}

function parseXML(filename) {
    const parser = new xml2js.Parser({ mergeAttrs: true, explicitArray: false, explicitRoot: false, charkey: 'content' });

    let xmlContent = fs.readFileSync(filename, "utf8");
    
    var JSONMetadata = null;
    
    parser.parseString(xmlContent, (err, result) => {
        if(err === null) {
            JSONMetadata = result;
        }
        else {
            error(err);
        }
    });

    return JSONMetadata;
}

function defined(object) {
    return (typeof object != 'undefined' && object != null);
}

// the Mago's metadata array in the XML are transformed in JS objects with a single propoerty which is an array
// <Fields>
//   <Column Name="AccTpl" ></Column>
//   <Column Name="PostingDate"></Column>
// </Fields>
// Fields {
//     Column : [
//         {Name="AccTpl"},
//         {Name="PostingDate"}
//     ]
// }
function isArray(object) {
    if (typeof object !== 'object') return false;
    var ar = _.keys(object);
    return ar.length == 1 && Array.isArray(object[ar[0]]);
}

// ensure to return always an array from a value that can be empty, have a single value, or being already an array
function asArray(value) {
    if (typeof value === 'undefined' || value === null || value === '') return [];
    return Array.isArray(value) ? value : [value];
}

// normalizes a Mago metadata node (missing, single child, or array) into a real array
function normalize(container, elem) {
    return defined(container) ? asArray(container[elem]) : [];
}

function objectName(namespace) {
    var segments = namespace.split('.');
    return segments.length > 0 ? segments[segments.length - 1] : "";
}

function appName(namespace) {
    var segments = namespace.split('.');
    return segments.length == 4 ? segments[0] : 
            segments.length == 5 ? segments[1] : "";
}

function dashed(namespace) {
    return namespace.replace(/\./g,"-");
}

// return a namespace without type and library
// typical namespace: Type.App.Module.Library.Object
function compact(namespace) {
    var segments = namespace.split('.');
    if (segments.length == 5) { // start with type, i.e.: Table, Document, etc.
        return `${segments[1]}.${segments[2]}.${segments[4]}`;
    } else if (segments.length == 4) { // no trailing type
        return `${segments[0]}.${segments[1]}.${segments[3]}`;
    } else {
        return namespace; // unknown structure
    }
}

function isBatch(viewModes) {
    if (!defined(viewModes) || !defined(viewModes.Mode) || !Array.isArray(viewModes.Mode))
        return false; // not a batch as default; if no DBTs, warning

    var batch = false;
    viewModes.Mode.forEach(m => {
        if (defined(m.type) && (m.type === "batch" || m.type === "finder"))
            batch = true;
    });
    return batch;
}

export default   {
    scanFor,
    parseXML,
    defined,
    isArray,
    asArray,
    normalize,
    objectName,
    appName,
    dashed,
    compact,
    isBatch
}
