export class Index {
    heading = "Gardening";

    // https://scottwhittaker.net/aurelia/2016/06/12/aurelia-router-demo.html
    configureRouter(config, router) {
        config.map([
            { route: "", redirect: "companions"},
            { route: "companions", name: "companions", moduleId: "pages/gardening/companions", nav: true, title: "Companions" },
            { route: "plants", name: "plants", moduleId: "pages/gardening/plants", nav: true, title: "Plants" },
            { route: "companion-setup", name: "companion-setup", moduleId: "pages/gardening/companion-setup", nav: true, title: "Companion Setup" }
        ]);

        this.router = router;
    }
}