import {inject} from "aurelia-framework";
import {AuthenticationManager} from "../features/authentication/authentication-manager";

@inject(AuthenticationManager)
export class Profile {

    name;

    picture;
    
    email;

    emailVerified;

    permissions;

    tokenExpiryDate;

    constructor(authenticationManager) {
        this.auth = authenticationManager;
    }

    activate() {
        this.name = this.auth.profile.name;
        this.picture = this.auth.profile.picture;
        this.email = this.auth.profile.email;
        this.emailVerified = this.auth.profile.email_verified;
        this.permissions = this.auth.permissions || [];
        this.tokenExpiryDate = new Date(this.auth.exp * 1000);
    }
}