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
                'aurelia-framework',
                'aurelia-bootstrapper',
                'aurelia-fetch-client',
                'aurelia-router',
                'aurelia-animator-css',
                "aurelia-templating-binding",
                "aurelia-polyfills",
                "aurelia-templating-resources",
                "aurelia-templating-router",
                "aurelia-loader-default",
                "aurelia-history-browser",
                "aurelia-logging-console",
                "fetch",
                "bootstrap",
                "bootstrap/css/bootstrap.css!text",
                "jquery"  // required by bootstrap
            ],
            options: {
                inject: true,
                minify: true,
                rev: true
            }
        }
    }
};
