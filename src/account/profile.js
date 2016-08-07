import {inject} from "aurelia-framework";
import {AuthenticationManager} from "../authentication/authentication-manager";

@inject(AuthenticationManager)
export class Profile {
    
    email;

    name;

    permissions;

    tokenExpiryDate;

    constructor(authenticationManager) {
        this.auth = authenticationManager;
    }

    activate() {
        let payload = this.auth.getTokenPayload();

        this.email = payload.email;
        this.name = payload.name;
        this.permissions = payload.permissions || [];
        this.tokenExpiryDate = new Date(this.auth.getExp() * 1000);
    }
}