import {inject, bindable} from "aurelia-framework";

@inject("authentication-manager")
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