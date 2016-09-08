import {inject} from "aurelia-framework";

@inject("authentication-manager")
export class Logout {
    constructor(authenticationManager) {
        this.auth = authenticationManager;
    }

    activate() {
        // since its stateless, we only need to delete the token in the browsers storage
        this.auth.logout();
    }
}
