import {inject, bindable} from "aurelia-framework";
import {AuthService} from "aurelia-authentication";

@inject(AuthService)
export class NavBar {
	@bindable router = null;

	constructor(authService) {
		this.authService = authService;
	}

	get isAuthenticated() {
		return this.authService.isAuthenticated();
	}
}