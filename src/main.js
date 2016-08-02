import 'bootstrap';
import 'babel-polyfill';
import authConfig from './auth-config';

export function configure(aurelia) {
    aurelia.use
        .standardConfiguration()
        .developmentLogging()
        .plugin("aurelia-api", configure => {
            configure
                .registerEndpoint("internal", "http://192.168.1.230:8000")
                .registerEndpoint("another", "https://pi.bombers.space")
        })
        .plugin("authentication/aurelia-authentication", authConfig)
        .globalResources("authentication/auth-filter-value-converter");

    //Uncomment the line below to enable animation.
    //aurelia.use.plugin('aurelia-animator-css');
    //if the css animator is enabled, add swap-order="after" to all router-view elements

    //Anyone wanting to use HTMLImports to load views, will need to install the following plugin.
    //aurelia.use.plugin('aurelia-html-import-template-loader')

    aurelia.start().then(() => aurelia.setRoot());
}
