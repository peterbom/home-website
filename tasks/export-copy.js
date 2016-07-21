const cp = require("cp");
const bundleConfig = require('../bundleconfig.js');
const resources = require('../export.js');
const errorHandler = require("./error-handler.js");

function getBundles() {
  let bl = [];
  for (let b in bundleConfig.bundles) {
    bl.push(b + '*.js');
  }
  return bl;
}

let exportList = resources.list.concat(getBundles());
return Promise.all(exportList.map(f => cp(f, resources.exportPath))).catch(errorHandler.handleError);
