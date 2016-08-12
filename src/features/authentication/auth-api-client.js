export class AuthApiClient {
    constructor(authEndpoint, settings) {
        this._authEndpoint = authEndpoint;
        this._settings = settings;
    }

    async getProviderLookup() {
        return await this._authEndpoint.find(this._settings.providersResource);
    }

    async exchangeIdTokenForAccessToken(provider, idToken) {
        let tokenExchangeRequestBody = {
            id_token: idToken,
            provider: provider
        };

        return await this._authEndpoint.post(this._settings.tokenExchangeResource, tokenExchangeRequestBody);
    }
}