export class App {

    configureRouter(config, router) {
        this.router = router;
        config.title = 'Aurelia';
        config.map([
            { route: ['', 'welcome'], name: 'welcome',      moduleId: 'welcome',      nav: true, title: 'Welcome' },
            { route: 'users',         name: 'users',        moduleId: 'users',        nav: true, title: 'Github Users' },
            { route: 'child-router',  name: 'child-router', moduleId: 'child-router', nav: true, title: 'Child Router' },

            { route: 'login',         name: 'login',      moduleId: './account/login',     nav: false, title: 'Login' },
            { route: 'logout',        name: 'logout',     moduleId: './account/logout',    nav: false, title: 'Logout',  auth: true },
            { route: 'profile',       name: 'profile',    moduleId: './account/profile',   nav: false, title: 'Profile', auth: true }
/*
            { route: ["", "list"], name: "home", moduleId: "movies/list", title: "List", nav: true },
            { route: "about",           name: "about", moduleId: "about/about", title: "About", nav: true },
            { route: "details/:id", name: "details", moduleId: "movies/details", title: "Details" },
            { route: "edit/:id", name: "edit", moduleId: "movies/edit", title: "Edit" },
            { route: "create", name: "create", moduleId: "movies/edit", title: "Create" }
*/
        ]);
    }
}