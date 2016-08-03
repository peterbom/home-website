#!/usr/bin/env node

const fsp = require('fs-promise');
const path = require('path');
const errorHandler = require("./error-handler.js");

let argv = process.argv.slice(1);
let targetPath = argv.pop();
let cwd = path.resolve(process.cwd());
let toPath = path.join(cwd, targetPath);

if (!toPath) {
    console.log('Usage: set-env <targetPath>');
    return;
}

let content = `
window.env = window.env || {};
window.env.NODE_ENV = "${process.env.NODE_ENV}";
`;

function writeFile() {
    if (process.env.BUILD_OUTPUT === "verbose") {
        console.log(`Writing environment variables to ${toPath}`);
    }

    return fsp.writeFile(toPath, content)
        .then(function () {
            if (process.env.BUILD_OUTPUT === "verbose") {
                console.log(`Successfully written environment variables to ${toPath}`);
            }
        });
}

return writeFile().catch(errorHandler.handleError);
