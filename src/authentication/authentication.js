import {PLATFORM} from 'aurelia-pal';
import {inject} from 'aurelia-dependency-injection';
import jwtDecode from 'jwt-decode';
import * as LogManager from 'aurelia-logging';

import {BaseConfig}  from './base-config';
import {Storage} from './storage';
import {OAuth2} from './oAuth2';

@inject(Storage, BaseConfig, OAuth2)
export class Authentication {
    constructor(storage, config, oAuth2) {
        this.storage              = storage;
        this.config               = config;
        this.oAuth2               = oAuth2;
        this.updateTokenCallstack = [];
        this.accessToken          = null;
        this.refreshToken         = null;
        this.payload              = null;
        this.exp                  = null;
        this.hasDataStored        = false;
    }

    /* get/set responseObject */

    getResponseObject() {
        return JSON.parse(this.storage.get(this.config.storageKey));
    }

    setResponseObject(response) {
        if (response) {
            this.getDataFromResponse(response);
            this.storage.set(this.config.storageKey, JSON.stringify(response));
            return;
        }
        this.accessToken = null;
        this.refreshToken = null;
        this.payload = null;
        this.exp = null;

        this.hasDataStored = false;

        this.storage.remove(this.config.storageKey);
    }


    /* get data, update if needed first */

    getAccessToken() {
        if (!this.hasDataStored) this.getDataFromResponse(this.getResponseObject());
        return this.accessToken;
    }

    getRefreshToken() {
        if (!this.hasDataStored) this.getDataFromResponse(this.getResponseObject());
        return this.refreshToken;
    }

    getPayload() {
        if (!this.hasDataStored) this.getDataFromResponse(this.getResponseObject());
        return this.payload;
    }

    getExp() {
        if (!this.hasDataStored) this.getDataFromResponse(this.getResponseObject());
        return this.exp;
    }


 /* get status from data */

    getTtl() {
        const exp = this.getExp();
        return  Number.isNaN(exp) ? NaN : exp - Math.round(new Date().getTime() / 1000);
    }

    isTokenExpired() {
        const timeLeft = this.getTtl();
        return Number.isNaN(timeLeft) ? undefined : timeLeft < 0;
    }

    isAuthenticated() {
        const isTokenExpired = this.isTokenExpired();
        if (isTokenExpired === undefined ) return this.accessToken ? true : false;
        return !isTokenExpired;
    }


    /* get and set from response */

    getDataFromResponse(response) {
        const config   = this.config;

        this.accessToken = this.getTokenFromResponse(response, config.accessTokenProp, config.accessTokenName, config.accessTokenRoot);

        this.refreshToken = null;
        if (config.useRefreshToken) {
            try {
                this.refreshToken = this.getTokenFromResponse(response, config.refreshTokenProp, config.refreshTokenName, config.refreshTokenRoot);
            } catch (e) {
                this.refreshToken = null;
            }
        }

        this.payload = null;

        try {
            this.payload = this.accessToken ? jwtDecode(this.accessToken) : null;
        } catch (_) {_;}

        this.exp = this.payload ? parseInt(this.payload.exp, 10) : NaN;

        this.hasDataStored = true;

        return {
            accessToken: this.accessToken,
            refreshToken: this.refreshToken,
            payload: this.payload,
            exp: this.exp
        };
    }

    getTokenFromResponse(response, tokenProp, tokenName, tokenRoot) {
        if (!response) return undefined;

        const responseTokenProp = tokenProp.split('.').reduce((o, x) => o[x], response);

        if (typeof responseTokenProp === 'string') {
            return responseTokenProp;
        }

        if (typeof responseTokenProp === 'object') {
            const tokenRootData = tokenRoot && tokenRoot.split('.').reduce((o, x) => o[x], responseTokenProp);
            const token = tokenRootData ? tokenRootData[tokenName] : responseTokenProp[tokenName];

            if (!token) throw new Error('Token not found in response');

            return token;
        }

        const token = response[tokenName] === undefined ? null : response[tokenName];

        if (!token) throw new Error('Token not found in response');

        return token;
    }


    toUpdateTokenCallstack() {
        return new Promise(resolve => this.updateTokenCallstack.push(resolve));
    }

    resolveUpdateTokenCallstack(response) {
        this.updateTokenCallstack.map(resolve => resolve(response));
        this.updateTokenCallstack = [];
    }


    /**
     * Authenticate with third-party
     *
     * @param {String}    name of the provider
     * @param {[{}]}      [userData]
     *
     * @return {Promise<response>}
     */
    async authenticate(name, userData = {}) {
        let providers = await this.config.getProviders();
        return await this.oAuth2.open(providers[name], userData);
    }

    redirect(redirectUrl, defaultRedirectUrl) {
        // stupid rule to keep it BC
        if (redirectUrl === true) {
            LogManager.getLogger('authentication').warn('DEPRECATED: Setting redirectUrl === true to actually *not redirect* is deprecated. Set redirectUrl === 0 instead.');
            return;
        }
        // stupid rule to keep it BC
        if (redirectUrl === false) {
            LogManager.getLogger('authentication').warn('BREAKING CHANGE: Setting redirectUrl === false to actually *do redirect* is deprecated. Set redirectUrl to undefined or null to use the defaultRedirectUrl if so desired.');
        }
        // BC hack. explicit 0 means don't redirect. false will be added later and 0 deprecated
        if (redirectUrl === 0) {
            return;
        }
        if (typeof redirectUrl === 'string') {
            PLATFORM.location.href = encodeURI(redirectUrl);
        } else if (defaultRedirectUrl) {
            PLATFORM.location.href = defaultRedirectUrl;
        }
    }
}
