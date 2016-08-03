import {inject, bindable} from "aurelia-framework";
import {AuthService} from "./authentication/auth-service";

@inject(AuthService)
export class NavBar {

	@bindable router = null;

    /**
     * The AuthService that supplies authentication information
     *
     * @param  {AuthService}
     */
    authService;

	constructor(authService) {
		this.authService = authService;
	}

	get isAuthenticated() {
		return this.authService.isAuthenticated();
	}
}