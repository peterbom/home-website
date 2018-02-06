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
                "aurelia-computed",
                "aurelia-dependency-injection",
                "aurelia-dialog",
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
                "base64-url",
                "bluebird",
                "bootstrap",
                "bootstrap/css/bootstrap.css!text",  // not a jspm dependency
                "d3",
                "fetch",
                "font-awesome",
                "jquery",  // required by bootstrap
                "jquery-datetimepicker",
                "js-md5",
                "jwt-decode",
                "moment",
                "select2",
                //"select2-bootstrap-theme", -- not needed, only involves CSS
                "sortable",
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
