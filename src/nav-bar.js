import {inject, bindable} from "aurelia-framework";
import {AuthenticationManager} from "./authentication/authentication-manager";

@inject(AuthenticationManager)
export class NavBar {

    @bindable router = null;

    /**
     * The AuthenticationManager that supplies authentication information
     *
     * @param  {AuthenticationManager}
     */
    auth;

    constructor(authenticationManager) {
        this.auth = authenticationManager;
    }
}