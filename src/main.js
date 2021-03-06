// disable automatic object creation:
import {AccessMember} from 'aurelia-framework';
import 'bootstrap';
import 'babel-polyfill';

// Don't remove this import. The env.js file is generated at build time
import "./env.js";

import {apiConfig, authConfig} from "./config";

// Disable automatic object creation via bindings
// https://github.com/aurelia/binding/issues/205
AccessMember.prototype.assign = function(scope, value) {
    let instance = this.object.evaluate(scope);

    if(instance === null || instance === undefined) {
        return;
    }

    return instance[this.name] = value;
}

// In case we need to set the root according to the authentication status:
//import {AuthService} from "./authentication/auth-service";

// After aurelia.start(), set the initial page to login if the user is not authenticated
//var auth = aurelia.container.get(AuthService);
//let root = auth.isAuthenticated() ? "app" : "account/login";
//aurelia.setRoot(root);

export const configure = async function (aurelia) {
    aurelia.use
        .standardConfiguration()
        .developmentLogging()
        .plugin("aurelia-computed", { // install the plugin
            enableLogging: true // enable debug logging to see aurelia-computed's observability messages.
        })
        .plugin("aurelia-validation")
        .plugin("aurelia-validatejs")
        .plugin("aurelia-dialog", config => {
            config.useDefaults();
            config.useCSS("");
        })
        .plugin("aurelia-api", configure => {
            configure
                .registerEndpoint("main", apiConfig.mainEndpoint)
                .registerEndpoint("function", apiConfig.functionEndpoint)
                .registerEndpoint("packaging", apiConfig.packagingEndpoint)
        })
        .feature("features/utils")
        .feature("features/authentication", authConfig)
        .feature("features/azure-services")
        .feature("resources/components")
        .feature("resources/converters")
        .feature("resources/custom-elements")
        .feature("resources/custom-attributes");

    //Uncomment the line below to enable animation.
    //aurelia.use.plugin('aurelia-animator-css');
    //if the css animator is enabled, add swap-order="after" to all router-view elements

    //Anyone wanting to use HTMLImports to load views, will need to install the following plugin.
    //aurelia.use.plugin('aurelia-html-import-template-loader')

    await aurelia.start();

    aurelia.setRoot("app");
};
