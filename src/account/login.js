import {inject} from "aurelia-framework";
import {AuthService} from "aurelia-authentication";

@inject(AuthService)
export class Login {
	constructor(authService) {
		this.authService = authService;
	}

	authenticate(name) {
		return this.authService.authenticate(name);
	}
}