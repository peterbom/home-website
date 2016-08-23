import {inject} from 'aurelia-dependency-injection';
import jwtDecode from 'jwt-decode';

import {Storage} from './storage';

const ID_TOKEN_KEY = "auth-id-token";
const USER_PROFILE_KEY = "auth-user-profile";
const PERMISSIONS_KEY = "auth-permissions";

@inject(Storage)
export class TokenManager {

    idToken;

    profile;

    permissions = [];

    payload;

    exp;

    constructor(storage) {
        this._storage = storage;
        this.refreshFromStorage();
    }

    refreshFromStorage() {
        this.idToken = this._storage.get(ID_TOKEN_KEY);

        let profileJson = this._storage.get(USER_PROFILE_KEY);
        this.profile = profileJson ? JSON.parse(profileJson) : null;

        let permissionsJson = this._storage.get(PERMISSIONS_KEY);
        this.permissions = permissionsJson ? JSON.parse(permissionsJson) : null;

        this.refreshIdTokenData();
    }

    refreshIdTokenData() {
        this.payload = null;
        this.exp = null;

        if (this.idToken) {
            try {
                this.payload = jwtDecode(this.idToken);
            } catch (_) {_;}

            this.exp = this.payload ? parseInt(this.payload.exp, 10) : NaN;
        }
    }

    setIdToken(idToken) {
        this.idToken = idToken;

        if (idToken) {
            this._storage.set(ID_TOKEN_KEY, idToken);
        } else {
            this._storage.remove(ID_TOKEN_KEY);
        }

        this.refreshIdTokenData();
    }

    setProfile(profile) {
        this.profile = profile;

        if (profile) {
            this._storage.set(USER_PROFILE_KEY, JSON.stringify(profile));
        } else {
            this._storage.remove(USER_PROFILE_KEY);
        }
    }

    setPermissions(permissions) {
        this.permissions = permissions;

        if (permissions) {
            this._storage.set(PERMISSIONS_KEY, JSON.stringify(permissions));
        } else {
            this._storage.remove(PERMISSIONS_KEY);
        }
    }
}
