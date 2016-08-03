import {inject} from "aurelia-framework";
import {AuthService} from "../authentication/auth-service";

@inject(AuthService)
export class Logout {
    constructor(authService) {
        this.authService = authService;
    }

    activate() {
        // since its stateless, we only need to delete the token in the browsers storage
        this.authService.logout();
    }
}
