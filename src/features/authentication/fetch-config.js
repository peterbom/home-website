
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

                let accessToken = this._authenticationManager.getAccessToken();
                if (!accessToken) {
                    return request;
                }

                request.headers.set("Authorization", `Bearer ${accessToken}`);

                return request;
            }/*,
            response: (response, request) => Promise.resolve(response)*/
        };
    }
}
