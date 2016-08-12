import {inject} from "aurelia-framework";
import {PLATFORM} from "aurelia-pal";

import {AuthenticationManager} from "./features/authentication/authentication-manager";

@inject(AuthenticationManager)
export class App {

    constructor(authenticationManager) {
        this.authenticationManager = authenticationManager;
    }

    configureRouter(config, router) {
        this.router = router;
        config.title = "Bombers' Space";
        config.map([
            { route: "", name: "home", moduleId: "./pages/home", nav: true, title: "Home" },
            { route: "login", name: "login", moduleId: "./pages/login", nav: false, title: "Login" },
            { route: "logout", name: "logout", moduleId: "./pages/logout", nav: false, title: "Logout", auth: true },
            { route: "profile", name: "profile", moduleId: "./pages/profile", nav: false, title: "Profile", auth: true, perm: "home_manage" },
            { route: "packaging", name: "packaging", moduleId: "./pages/packaging", nav: true, title: "Packaging", auth: true, perm: "home_manage" }
        ]);

        config.mapUnknownRoutes(async instr => {
            await this.authenticationManager.processRedirectUrl(PLATFORM.location.href);
            this.router.navigateToRoute("home");
        });
    }
}