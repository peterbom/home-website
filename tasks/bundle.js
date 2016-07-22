const bundler = require('aurelia-bundler');
const bundleConfig = require('../bundleconfig.js');
const errorHandler = require("./error-handler.js");

return bundler.bundle(bundleConfig).catch(errorHandler.handleError);
