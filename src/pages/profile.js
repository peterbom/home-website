import {inject} from "aurelia-framework";

@inject("authentication-manager")
export class Profile {

    idToken;

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
        this.idToken = this.auth.idToken;
        this.name = this.auth.profile.name;
        this.picture = this.auth.profile.picture;
        this.email = this.auth.profile.email;
        this.emailVerified = this.auth.profile.email_verified;
        this.permissions = this.auth.permissions || [];
        this.tokenExpiryDate = new Date(this.auth.exp * 1000);
    }
}