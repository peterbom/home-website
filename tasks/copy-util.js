const fsp = require('fs-promise');
const path = require('path');
const promisify = require("promisify-node");
const glob = promisify("glob");

function copyFile(fromPath, toDirectory, copyFrom) {
    // E.g.
    //   fromPath:     public/resources/resource.js
    //   toDirectory:  export
    //   copyFrom:     public
    // .
    // |_public
    // | |_resources
    // |   |_resource.js
    // |_export
    //   |_(resources)
    //     |_(resource.js)
    //
    // Need to issue a command like: cp public/resources/resource.js export/resources/resource.js

    // Get the path to copy, relative to copyFrom, e.g.
    // resources/resource.js
    let relativePath = path.relative(copyFrom, fromPath);

    // Join this to the destination directory, e.g.
    // export/resources/resource.js
    let toPath = path.join(toDirectory, relativePath);

    if (process.env.BUILD_OUTPUT === "verbose") {
        console.log(`copying ${fromPath} to ${toPath}`);
    }

    // Return a promise
    return fsp.copy(fromPath, toPath);
}

function copyFileOrGlob (fromGlob, toDirectory, copyFrom) {
    copyFrom = copyFrom || "";

    // To expand the glob, we must be able to locate it on the filesystem
    let fromGlobPath = path.join(copyFrom, fromGlob);

    return glob(fromGlobPath).then(fromPaths => {
        return Promise.all(fromPaths.map(fromPath => {
            return copyFile(fromPath, toDirectory, copyFrom);
        }));
    });
};

module.exports.copyFilesOrGlobs = function (fromGlobs, toDirectory, copyFrom) {
    let promises = fromGlobs.map(fileOrGlob => {
        return copyFileOrGlob(fileOrGlob, toDirectory, copyFrom);
    });

    return Promise.all(promises);
};