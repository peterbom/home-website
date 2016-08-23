import {inject} from "aurelia-framework";
import {AuthenticationManager} from "../features/authentication/authentication-manager";

@inject(AuthenticationManager)
export class Login {
    constructor(authenticationManager) {
        this.auth = authenticationManager;
    }

    activate() {
        this.auth.requestSignIn();
    }
}