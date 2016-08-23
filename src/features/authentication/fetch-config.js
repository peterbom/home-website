
export class FetchConfig {

    constructor(apiConfig, authenticationManager, clientNames) {
        this._authenticationManager = authenticationManager;

        clientNames.forEach(client => {

            let endpoint = apiConfig.getEndpoint(client);
            if (!endpoint) {
                throw new Error(`There is no '${client || 'default'}' endpoint registered.`);
            }

            endpoint.client.interceptors.push(this.interceptor);
        });
    }

    /**
     * Interceptor for HttpClient
     *
     * @return {{request: Function, response: Function}}
     */
    get interceptor() {
        return {
            request: request => {
                if (!this._authenticationManager.authenticated) {
                    return request;
                }

                let idToken = this._authenticationManager.idToken;
                if (!idToken) {
                    return request;
                }

                request.headers.set("Authorization", `Bearer ${idToken}`);

                return request;
            }
        };
    }
}
