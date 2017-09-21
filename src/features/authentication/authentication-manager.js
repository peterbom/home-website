import {PLATFORM} from "aurelia-pal";
import * as LogManager from 'aurelia-logging';

import Promise from "bluebird";

export class AuthenticationManager {

    authenticated = false;

    idToken = undefined;

    idTokenPayload = undefined;

    exp = undefined;

    permissions = [];

    profile = undefined;

    onLogout = undefined;

    constructor(auth0Lock, permissionsEndpoint, tokenManager, authChangeNotifier, settings) {
        this._auth0Lock = auth0Lock;
        this._permissionsEndpoint = permissionsEndpoint;
        this._tokenManager = tokenManager;
        this._authChangeNotifier = authChangeNotifier;
        this._settings = settings;

        this._timeoutId = 0;

        // refresh status from dependencies
        this.refreshAuthenticationStatus();

        // Auth0 lock initialization
        this._getProfileAsync = Promise.promisify(
                (idToken, callback) => this._auth0Lock.getProfile(idToken, callback));

        this._auth0Lock.on("authenticated", authResult => this.handleProviderAuthentication(authResult));
    }

    refreshAuthenticationStatus() {
        this.authenticated = !!this._tokenManager.idToken;
        this.idToken = this._tokenManager.idToken;
        this.idTokenPayload = this._tokenManager.payload;
        this.exp = this._tokenManager.exp;
        this.permissions = this._tokenManager.permissions;
        this.profile = this._tokenManager.profile;

        this._authChangeNotifier.notify(this.authenticated);

        // Refresh timeout
        if (this._timeoutId) {
            PLATFORM.global.clearTimeout(this._timeoutId);
        }

        this._timeoutId = 0;

        if (this.authenticated && !Number.isNaN(this.exp)) {
            // Known ttl
            let ttl = this.getTtl() * 1000;
            let timeoutCallback = () => {
                this.logout(this._settings.expiredRedirectUrl);
            };

            this._timeoutId = PLATFORM.global.setTimeout(timeoutCallback, ttl);
        }
    }

    redirect(redirectUrl) {
        if (typeof redirectUrl === 'string') {
            PLATFORM.location.href = encodeURI(redirectUrl);
        }
    }

    requestSignIn() {
        this._auth0Lock.show();
    }

    async handleProviderAuthentication (authResult) {
        this._auth0Lock.hide();

        this._tokenManager.setIdToken(authResult.idToken);

        // Refresh authentication status before making further requests because we
        // need to set the authorization header for the permission request.
        this.refreshAuthenticationStatus();

        // Get user profile data and permissions in parallel
        let userInfoTasks = [
            this._getProfileAsync(authResult.idToken),
            this._permissionsEndpoint.find(this._settings.permissionsResource)
        ];

        let [profile, permissions] = await Promise.all(userInfoTasks);

        // Update the token manager
        this._tokenManager.setProfile(profile);
        this._tokenManager.setPermissions(permissions);

        // Refresh status from updated token manager and notify
        this.refreshAuthenticationStatus();
    }

    async logout(redirectUrl) {
        this._tokenManager.setIdToken(null);
        this._tokenManager.setProfile(null);
        this._tokenManager.setPermissions(null);

        this.refreshAuthenticationStatus();

        redirectUrl = redirectUrl || this._settings.logoutRedirectUrl;

        if (typeof this.onLogout === 'function') {
            await this.onLogout();
        }

        this.redirect(redirectUrl);
    }

    getTtl() {
        return  Number.isNaN(this.exp) ? NaN : this.exp - Math.round(new Date().getTime() / 1000);
    }

    isTokenExpired() {
        const timeLeft = this.getTtl();
        return Number.isNaN(timeLeft) ? undefined : timeLeft < 0;
    }
}
