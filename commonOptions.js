import commandLineArgs from 'command-line-args';

const optionDefinitions = [
                              { name: 'input', type: String, defaultValue: "" },
                              { name: 'output', type: String, defaultValue: "" },
                              { name: 'apps', type: String, multiple: true, defaultValue: [] },
                              { name: 'modules', type: String, multiple: true, defaultValue: [] }
                          ];
const options  = commandLineArgs(optionDefinitions);

export { options }