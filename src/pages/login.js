import {inject} from "aurelia-framework";

@inject("authentication-manager")
export class Login {
    constructor(authenticationManager) {
        this.auth = authenticationManager;
    }

    activate() {
        this.auth.requestSignIn();
    }
}