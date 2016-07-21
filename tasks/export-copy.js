const cp = require("cp");
const path = require('path');
const bundleConfig = require('../bundleconfig.js');
const resources = require('../export.js');
const errorHandler = require("./error-handler.js");

function getResources() {
	return resources.list.map(resource => path.join(resources.resourcePath, resource));
}

function getBundles() {
  let bl = [];
  for (let b in bundleConfig.bundles) {
    bl.push(b + '*.js');
  }
  return bl;
}

let exportList = getResources().concat(getBundles());
return Promise.all(exportList.map(f => cp(f, resources.exportPath))).catch(errorHandler.handleError);
