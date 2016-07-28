import {inject} from "aurelia-framework";
import {AuthService} from "aurelia-framework";

@inject(AuthService)
export class Profile {
	constructor(authService) {
		this.authService = authService;
		this.profile = null;
	}

	async activate() {
		this.profile = await this.authService.getMe();
	}

	async update() {
		this.profile = await this.authService.updateMe(this.profile);
	}

	async link(provider) {
		await this.authService.authenticate(provider, 0);	// 0=don't redirect
		this.profile = await this.authService.getMe();
	}

	async unlink(provider) {
		await this.authService.unlink(provider);
		this.profile = await this.authService.getMe();
	}
}