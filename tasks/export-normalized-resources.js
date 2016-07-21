const jspm = require('jspm');
const cp = require("cp");
const resources = require('../export.js');
const errorHandler = require("./error-handler.js");

const pathsToNormalize = resources.normalize;

let promises =  pathsToNormalize.map(pathSet => {
  const packageName = pathSet[ 0 ];
  const fileList = pathSet[ 1 ];

  return jspm.normalize(packageName).then((normalized) => {
    const packagePath = normalized.substring(normalized.indexOf('jspm_packages'), normalized.lastIndexOf('.js'));
    return fileList.map(file => packagePath + file);
  });
});

return Promise.all(promises).then((normalizedPaths) => {
  return normalizedPaths.reduce((prev, curr) => prev.concat(curr), []);
}).then(normalizedPaths => {
  return Promise.all(normalizedPaths.map(f => cp(f, resources.exportPath)));
}).catch(errorHandler.handleError);
