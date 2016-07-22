const bundler = require('aurelia-bundler');
const path = require('path');
const del = require('del');
const bundleConfig = require('../bundleconfig.js');
const errorHandler = require("./error-handler.js");

function removeBundleFiles() {
    let promises = [];

    // Add bundles, expanding globs because the bundles may have revision numbers
    for (let bundleName in bundleConfig.bundles) {
        let glob = path.join(bundleConfig.baseURL, bundleName) + "*.js";
        if (process.env.BUILD_OUTPUT === "verbose") {
            console.log(`deleting ${glob}`);
        }

        promises.push(del(glob));
    }

    return Promise.all(promises);
}

return bundler
    .unbundle(bundleConfig)
    .then(removeBundleFiles)
    .catch(errorHandler.handleError);
