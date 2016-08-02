import {inject} from "aurelia-framework";
import {AuthService} from "../authentication/auth-service";

@inject(AuthService)
export class Login {
	constructor(authService) {
		this.authService = authService;
	}

	authenticate(name) {
		return this.authService.authenticate(name);
	}
}