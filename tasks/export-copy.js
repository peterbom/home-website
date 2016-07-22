const bundleConfig = require('../bundleconfig.js');
const resources = require('../export.js');
const copyUtil = require("./copy-util.js");
const errorHandler = require("./error-handler.js");

function getExportList() {
    let filesOrGlobs = Array.from(resources.list);

    // Add bundles, expanding globs because the bundles may have revision numbers
    for (let bundleName in bundleConfig.bundles) {
        filesOrGlobs.push(bundleName + "*.js");
    }

    return filesOrGlobs;
}

return copyUtil
    .copyFilesOrGlobs(getExportList(), resources.exportPath, bundleConfig.baseURL)
    .catch(errorHandler.handleError);
