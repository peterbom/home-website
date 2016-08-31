export class Index {
    heading = "Manage Photos";

    // https://scottwhittaker.net/aurelia/2016/06/12/aurelia-router-demo.html
    configureRouter(config, router) {
        config.map([
            { route: "", redirect: "manage"},
            { route: "manage", name: "manage", moduleId: "pages/photos/manage", title: "Manage" },
            { route: "list:/dir", name: "list", moduleId: "pages/photos/list", title: "List"},
            { route: "details/:id",  name: "details",  moduleId: "pages/photos/details",  title: "Details" }
        ]);

        this.router = router;
    }
}