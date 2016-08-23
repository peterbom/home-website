module.exports = {
    force: true,
    baseURL: '.',                   // baseURL of the application
    configPath: 'config.js',      // config.js file. Must be within `baseURL`
    bundles: {
        "dist/app-build": {              // bundle name/path. Must be within `baseURL`. Final path is: `baseURL/dist/app-build.js`.
            includes: [
                '[**/*.js]',             // Don't recursively trace dependencies (avoid pulling in Aurelia framework files)
                '**/*.html!text',
                '**/*.css!text',        
            ],
            options: {
                inject: true,
                minify: true,
                rev: true
            }
        },
        "dist/vendor-build": {
            includes: [
                "aurelia-animator-css",
                "aurelia-api",
                "aurelia-bootstrapper",
                "aurelia-dependency-injection",
                "aurelia-event-aggregator",
                "aurelia-fetch-client",
                "aurelia-framework",
                "aurelia-history-browser",
                "aurelia-loader-default",
                "aurelia-logging",
                "aurelia-logging-console",
                "aurelia-pal",
                "aurelia-pal-browser",
                "aurelia-path",
                "aurelia-polyfills",
                "aurelia-router",
                "aurelia-templating-binding",
                "aurelia-templating-resources",
                "aurelia-templating-router",
                "aurelia-validatejs",
                "aurelia-validation",
                "auth0-lock",
                "babel-polyfill",
                "bluebird",
                "bootstrap",
                "bootstrap/css/bootstrap.css!text",  // not a jspm dependency
                "fetch",
                "font-awesome",
                "jquery",  // required by bootstrap
                "jwt-decode",
                "moment",
                "text"
            ],
            options: {
                inject: true,
                minify: true,
                rev: true
            }
        }
    }
};
