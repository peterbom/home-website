
export class App {

    configureRouter(config, router) {
        this.router = router;
        config.title = "Bombers' Space";
        config.map([
            { route: "", name: "home", moduleId: "pages/home", nav: true, title: "Home" },
            { route: "login", name: "login", moduleId: "pages/login", nav: false, title: "Login" },
            { route: "logout", name: "logout", moduleId: "pages/logout", nav: false, title: "Logout" },
            { route: "profile", name: "profile", moduleId: "pages/profile", nav: false, title: "Profile", perm: "home_manage" },
            { route: "wol", name: "wol", moduleId: "pages/wol", nav: true, title: "WOL", perm: "home_manage" },
            { route: "packaging", name: "packaging", moduleId: "pages/packaging/index", nav: true, title: "Packaging", perm: "packaging_maintain" }
        ]);
    }
}