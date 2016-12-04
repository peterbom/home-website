import {inject, bindable} from "aurelia-framework";

@inject("authentication-manager")
export class Index {
    heading = "Gardening";
    auth;

    constructor(authenticationManager) {
        this.auth = authenticationManager;
    }

    // https://scottwhittaker.net/aurelia/2016/06/12/aurelia-router-demo.html
    configureRouter(config, router) {
        config.map([
            { route: "", redirect: "companions"},
            { route: "companions", name: "companions", moduleId: "pages/gardening/companions", nav: true, title: "Companions" },
            { route: "plants", name: "plants", moduleId: "pages/gardening/plants", nav: true, title: "Plants", perm: "home_manage" },
            { route: "companion-setup", name: "companion-setup", moduleId: "pages/gardening/companion-setup", nav: true, title: "Companion Setup", perm: "home_manage" }
        ]);

        this.router = router;
    }
}