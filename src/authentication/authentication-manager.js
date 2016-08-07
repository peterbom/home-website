import {PLATFORM} from "aurelia-pal";
import * as LogManager from 'aurelia-logging';

const CURRENT_PROVIDER_NAME_KEY = "current-provider-name";

export class AuthenticationManager {

    authenticated = false;

    constructor(authApiClient, providerManager, tokenManager, bindingSignaler, eventAggregator, settings) {
        this._authApiClient = authApiClient;
        this._providerManager = providerManager;
        this._tokenManager = tokenManager;
        this._bindingSignaler = bindingSignaler;
        this._eventAggregator = eventAggregator;
        this._settings = settings;

        this._timeoutId = 0;

        // initialize status by resetting if existing stored responseObject
        this.setAccessToken(this.getAccessToken());
    }

    clearTimeout() {
        if (this._timeoutId) {
            PLATFORM.global.clearTimeout(this._timeoutId);
        }

        this._timeoutId = 0;
    }

    setTimeout(ttl) {
        this.clearTimeout();

        this._timeoutId = PLATFORM.global.setTimeout(() => {
            this.logout(this._settings.expiredRedirectUrl);
        }, ttl);
    }

    redirect(redirectUrl) {
        if (typeof redirectUrl === 'string') {
            PLATFORM.location.href = encodeURI(redirectUrl);
        }
    }

    async requestSignIn(name) {
        this._providerManager.currentProviderName = name;
        let request = await this._providerManager.createSigninRequest();
        window.location = request.url;
    }

    async processRedirectUrl(url) {
        let provider = this._providerManager.currentProviderName;
        if (!provider) {
            return;
        }

        let oidcClient = await this._providerManager.getOidcClient(provider);
        if (!oidcClient) {
            return;
        }

        let response = await oidcClient.processSigninResponse(window.location.href);
        if (!response || !response.id_token) {
            return;
        }

        try {
            let accessTokenResponse = await this._authApiClient.exchangeIdTokenForAccessToken(provider, response.id_token);
            this.setAccessToken(accessTokenResponse.access_token);
        } catch (err) {
            LogManager.getLogger('authentication').warn("error exchanging id token for access token");
            this.setAccessToken(null);
        }
    }

    getAccessToken() {
        return this._tokenManager.getAccessToken();
    }

    setAccessToken(accessToken) {
        this.clearTimeout();

        this._tokenManager.setAccessToken(accessToken);

        let wasAuthenticated = this.authenticated;
        this.authenticated = this._tokenManager.isAuthenticated();

        if (this.authenticated && !Number.isNaN(this._tokenManager.exp)) {
            this.setTimeout(this._tokenManager.getTtl() * 1000);
        }

        if (wasAuthenticated !== this.authenticated) {
            this._bindingSignaler.signal('authentication-change');
            this._eventAggregator.publish('authentication-change', this.authenticated);

            LogManager.getLogger('authentication').info(`Authorization changed to: ${this.authenticated}`);
        }
    }

    getTokenPayload() {
        return this._tokenManager.getPayload();
    }

    getExp() {
        return this._tokenManager.getExp();
    }

    async logout(redirectUrl) {
        this.setAccessToken(null);

        redirectUrl = redirectUrl || this._settings.logoutRedirectUrl;

        if (typeof this.onLogout === 'function') {
            await this.onLogout();
        }

        this.redirect(redirectUrl);
    }
}
