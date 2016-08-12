import {PLATFORM} from "aurelia-pal";
import {OidcClient} from "oidc-client";
import moment from "moment";

const CURRENT_PROVIDER_NAME_KEY = "current-provider-name";
const PROVIDER_SETTINGS_LOOKUP_KEY = "provider-settings-lookup";

export class ProviderManager {

    constructor(authApiClient, storage) {
        this._authApiClient = authApiClient;
        this._storage = storage;
        this._clientLookup = null;
    }

    get currentProviderName() {
        return this._storage.get(CURRENT_PROVIDER_NAME_KEY);
    }

    set currentProviderName(value) {
        this._storage.set(CURRENT_PROVIDER_NAME_KEY, value);
    }

    async getOidcClientLookup() {
        if (this._clientLookup) {
            return this._clientLookup;
        }

        let providerLookupValue = this._storage.get(PROVIDER_SETTINGS_LOOKUP_KEY);
        let providerLookup = providerLookupValue ? JSON.parse(providerLookupValue) : null;
        if (!providerLookup || !providerLookup.expiry || providerLookup.expiry < new Date()) {
            // Cached provider data is missing or expired. Retrieve from server
            providerLookup = await this._authApiClient.getProviderLookup();

            // Cache it
            providerLookup.expiry = moment().add(1, "hour").toDate();
            this._storage.set(PROVIDER_SETTINGS_LOOKUP_KEY, JSON.stringify(providerLookup));
        }

        // Build OIDC client data from provider information
        this._clientLookup = {};
        for (let name in providerLookup) {
            let provider = providerLookup[name];
            /*
            https://github.com/IdentityModel/oidc-client-js/wiki
            "Required" settings:
            - authority
            - client_id
            - redirect_uri
            - response_type
            - scope
            - metadata
                - issuer
                - authorization_endpoint
                - userinfo_endpoint  * can't get for outlook
                - end_session_endpoint  * can't get for outlook
                - jwks_uri  * can't get
            - signingKeys
            */

            /*
            Optional settings:
            - prompt
            - display
            - max_age
            - ui_locales
            - login_hint
            - acr_values
            */
            this._clientLookup[name] = new OidcClient({
                authority: provider.authority,
                client_id: provider.clientId,
                redirect_uri: PLATFORM.location.origin,
                response_type: "id_token",
                scope: "openid email profile",
                metadata: {
                    issuer: provider.issuer,
                    authorization_endpoint: provider.authorizationEndpoint
                },
                signingKeys: provider.signingKeys
            });
        }

        return this._clientLookup;
    }

    async getOidcClient(name) {
        let clientLookup = await this.getOidcClientLookup();
        return clientLookup[name];
    }

    async createSigninRequest() {
        let name = this.currentProviderName;
        if (!name) {
            throw new Error("Provider expected to be set before creating a signin request");
        }

        let oidcClient = await this.getOidcClient(name);
        if (!oidcClient) {
            throw new Error("Unknown OIDC client " + name);
        }

        this.currentProviderName = name;
        return await oidcClient.createSigninRequest();
    }
}
