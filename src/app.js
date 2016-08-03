export class App {

    configureRouter(config, router) {
        this.router = router;
        config.title = "Bombers' Space";
        config.map([
            { route: '',              name: 'home',         moduleId: 'home',         nav: true, title: 'Home' },
            { route: 'users',         name: 'users',        moduleId: 'users',        nav: true, title: 'Github Users', auth: true, perm: "home_manage" },
            { route: 'child-router',  name: 'child-router', moduleId: 'child-router', nav: true, title: 'Child Router', auth: true, perm: "home_manage" },

            { route: 'login',         name: 'login',      moduleId: './account/login',     nav: false, title: 'Login' },
            { route: 'logout',        name: 'logout',     moduleId: './account/logout',    nav: false, title: 'Logout',  auth: true },
            { route: 'profile',       name: 'profile',    moduleId: './account/profile',   nav: false, title: 'Profile', auth: true, perm: "home_manage" }
        ]);
    }
}