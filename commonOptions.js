import commandLineArgs from 'command-line-args';
import { error } from './notifications.js';

const optionDefinitions = [
                              { name: 'input', type: String, defaultValue: "" },
                              { name: 'output', type: String, defaultValue: "" },
                              { name: 'apps', type: String, multiple: true, defaultValue: [] },
                              { name: 'modules', type: String, multiple: true, defaultValue: [] }
                          ];
const options  = commandLineArgs(optionDefinitions);

function prune(original, required, prompt = "Element") {
    // empty required list -> no pruning
    if (required.length == 0)
        return original;

    var pruned = [];
    required.forEach(req => {
        if (!original.some(o => o.toLowerCase() === req.toLowerCase()))
            error(`${prompt} ${req} does not exist`)
        else
            pruned.push(original.find(o => o.toLowerCase() === req.toLowerCase()))
    });
    return pruned;
}

export { options, prune }