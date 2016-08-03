import {inject} from "aurelia-framework";
import {AuthService} from "../authentication/auth-service";

@inject(AuthService)
export class Profile {
    
    email;

    name;

    permissions;

    tokenExpiryDate;

    constructor(authService) {
        this.authService = authService;
    }

    activate() {
        let payload = this.authService.getTokenPayload();

        this.email = payload.email;
        this.name = payload.name;
        this.permissions = payload.permissions || [];
        this.tokenExpiryDate = new Date(this.authService.getExp() * 1000);
    }
}