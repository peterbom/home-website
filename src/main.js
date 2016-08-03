import 'bootstrap';
import 'babel-polyfill';

import "./env.js";
import authConfig from './auth-config';

// In case we need to set the root according to the authentication status:
//import {AuthService} from "./authentication/auth-service";

// After aurelia.start(), set the initial page to login if the user is not authenticated
//var auth = aurelia.container.get(AuthService);
//let root = auth.isAuthenticated() ? "app" : "account/login";
//aurelia.setRoot(root);

let mainEndpoint;
let devEndpoint;

switch (window.env.NODE_ENV) {
    case "development":
        mainEndpoint = "http://192.168.1.230:8000/";
        devEndpoint = "http://192.168.1.200:8000/";
        break;
    case "production":
        mainEndpoint = "https://pi.bombers.space/";
        devEndpoint = "https://dev.bombers.space/";
        break;
    default:
        throw new Error(`Unexpected environment ${window.env.NODE_ENV}`);
}

export const configure = async function (aurelia) {
    aurelia.use
        .standardConfiguration()
        .developmentLogging()
        .plugin("aurelia-api", configure => {
            configure
                .registerEndpoint("main", mainEndpoint)
                .registerEndpoint("dev", devEndpoint)
        })
        .feature("authentication", authConfig);

    //Uncomment the line below to enable animation.
    //aurelia.use.plugin('aurelia-animator-css');
    //if the css animator is enabled, add swap-order="after" to all router-view elements

    //Anyone wanting to use HTMLImports to load views, will need to install the following plugin.
    //aurelia.use.plugin('aurelia-html-import-template-loader')

    await aurelia.start();

    aurelia.setRoot("app");
};
