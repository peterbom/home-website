export class Index {
    heading = "Manage Photos";

    // https://scottwhittaker.net/aurelia/2016/06/12/aurelia-router-demo.html
    configureRouter(config, router) {
        config.map([
            { route: "", redirect: "search"},
            { route: ["search", "search/:path"], name: "search", moduleId: "pages/photos/search", nav: true, title: "Search" },
            { route: "sync", name: "sync", moduleId: "pages/photos/sync", nav: true, title: "Sync" },
            { route: "unreadable", name: "unreadable", moduleId: "pages/photos/unreadable", nav: true, title: "Unreadable" },
            { route: "undated", name: "undated", moduleId: "pages/photos/undated", nav: true, title: "Undated" },
            { route: "duplicates", name: "duplicates", moduleId: "pages/photos/duplicates", nav: true, title: "Duplicates" },
            { route: "restructure", name: "restructure", moduleId: "pages/photos/restructure", nav: true, title: "Restructure" },
            { route: "move-from-dir/:path", name: "move-from-dir", moduleId: "pages/photos/move-from-dir", title: "Move From Directory" },
            { route: "import", name: "import", moduleId: "pages/photos/import", nav: true, title: "Import" },
            { route: "upload", name: "upload", moduleId: "pages/photos/upload", nav: true, title: "Upload" },
            { route: "details/:id",  name: "details",  moduleId: "pages/photos/details",  title: "Details" },
            { route: "resolve-duplicates/:id",  name: "resolve-duplicates",  moduleId: "pages/photos/resolve-duplicates",  title: "Resolve Duplicates" }
        ]);

        this.router = router;
    }
}