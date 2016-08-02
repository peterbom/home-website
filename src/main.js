import 'bootstrap';
import 'babel-polyfill';
import authConfig from './auth-config';

export const configure = async function (aurelia) {
    aurelia.use
        .standardConfiguration()
        .developmentLogging()
        .plugin("aurelia-api", configure => {
            configure
                .registerEndpoint("main", "http://192.168.1.230:8000/")
                .registerEndpoint("dev", "https://dev.bombers.space/")
        })
        .plugin("authentication/aurelia-authentication", authConfig)
        .globalResources("authentication/auth-filter-value-converter");

    //Uncomment the line below to enable animation.
    //aurelia.use.plugin('aurelia-animator-css');
    //if the css animator is enabled, add swap-order="after" to all router-view elements

    //Anyone wanting to use HTMLImports to load views, will need to install the following plugin.
    //aurelia.use.plugin('aurelia-html-import-template-loader')

    await aurelia.start();
    aurelia.setRoot();
};
