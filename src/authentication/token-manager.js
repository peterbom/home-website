import {inject} from 'aurelia-dependency-injection';
import jwtDecode from 'jwt-decode';
import * as LogManager from 'aurelia-logging';

import {Storage} from './storage';

const ACCESS_TOKEN_KEY = "auth-access-token"

@inject(Storage)
export class TokenManager {

    payload;

    exp;

    constructor(storage) {
        this._storage = storage;
        this._hasDataStored = false;
    }

    getAccessToken() {
        return this._storage.get(ACCESS_TOKEN_KEY);
    }

    setAccessToken(accessToken) {
        if (accessToken) {
            this.updateFromAccessToken(accessToken);
            this._storage.set(ACCESS_TOKEN_KEY, accessToken);
        } else {
            this.payload = null;
            this.exp = null;

            this._hasDataStored = false;

            this._storage.remove(ACCESS_TOKEN_KEY);
        }
    }

    getPayload() {
        if (!this._hasDataStored) {
            this.updateFromAccessToken(this.getAccessToken());
        };

        return this.payload;
    }

    getExp() {
        if (!this._hasDataStored) {
            this.updateFromAccessToken(this.getAccessToken());
        };

        return this.exp;
    }

    getTtl() {
        const exp = this.getExp();
        return  Number.isNaN(exp) ? NaN : exp - Math.round(new Date().getTime() / 1000);
    }

    isTokenExpired() {
        const timeLeft = this.getTtl();
        return Number.isNaN(timeLeft) ? undefined : timeLeft < 0;
    }

    isAuthenticated() {
        return this._hasDataStored && !this.isTokenExpired();
    }

    updateFromAccessToken(accessToken) {
        this.payload = null;

        try {
            this.payload = jwtDecode(accessToken);
        } catch (_) {_;}

        this.exp = this.payload ? parseInt(this.payload.exp, 10) : NaN;

        this._hasDataStored = true;
    }
}
