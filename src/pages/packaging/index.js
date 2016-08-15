export class Index {
    heading = "Packaging Home";

    // https://scottwhittaker.net/aurelia/2016/06/12/aurelia-router-demo.html
    configureRouter(config, router) {
        config.map([
            { route: "", redirect: "home"},
            { route: "home", name: "home", moduleId: "pages/packaging/home", nav: true, title: "Home"},
            { route: "construction-style/list", name: "construction-style-list", moduleId: "pages/packaging/construction-style/list", nav: true, title: "Construction Styles" },
            { route: "construction-style/edit/:id",  name: "construction-style-edit",  moduleId: "pages/packaging/construction-style/edit",  title: "Edit Construction Style" }
        ]);

        this.router = router;
    }
}