const jspm = require('jspm');
const bundleConfig = require('../bundleconfig.js');
const resources = require('../export.js');
const copyUtil = require("./copy-util.js");
const errorHandler = require("./error-handler.js");

function getNormalizedGlobs() {
    let promises =  resources.normalize.map(pathSet => {
        const packageName = pathSet[ 0 ];   // e.g. "font-awesome"
        const fileList = pathSet[ 1 ];      // e.g. ["/css/font-awesome.min.css", "/fonts/*"]

        return jspm.normalize(packageName).then((normalized) => {
            // normalized, e.g.: file:///C:/git/aurelia-home-website/public/jspm_packages/npm/font-awesome@4.6.3.js
            let packagePath = normalized.substring(
                normalized.indexOf("jspm_packages"),
                normalized.lastIndexOf('.js'));

            // packagePath, e.g.: jspm_packages/npm/font-awesome@4.6.3
            return fileList.map(file => packagePath + file);
        });
    });

    // Return a promise providing the flattened list of paths
    return Promise.all(promises).then(pathArrays => {
        return pathArrays.reduce((a, b) => a.concat(b));
    });
}

return getNormalizedGlobs().then(normalizedGlobs => {
    return copyUtil
        .copyFilesOrGlobs(normalizedGlobs, resources.exportPath, bundleConfig.baseURL)
        .catch(errorHandler.handleError);
}).catch(errorHandler.handleError);
