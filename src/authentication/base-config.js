import {PLATFORM} from 'aurelia-pal';
import {join} from 'aurelia-path';
import * as LogManager from 'aurelia-logging';

export class BaseConfig {
    constructor() {
        this.providers = null;
    }
    /**
     * Prepends baseUrl to a given url
     * @param  {String} url The relative url to append
     * @return {String}     joined baseUrl and url
     */
    joinBase(url) {
        return join(this.baseUrl, url);
    }

    /**
     * Merge current settings with incomming settings
     * @param  {Object} incoming Settings object to be merged into the current configuration
     * @return {Config}           this
     */
    configure(incoming) {
        for (let key in incoming) {
            const value = incoming[key];
            if (value !== undefined) {
                if (Array.isArray(value) || typeof value !== 'object' || value === null) {
                    this[key] = value;
                } else {
                    Object.assign(this[key], value);
                }
            }
        }
    }

    /* ----------- default  config ----------- */

    // Used internally. The used Rest instance; set during configuration (see index.js)
    client = null;

    // If using aurelia-api:
    // =====================

    // This is the name of the endpoint used for any requests made in relation to authentication (login, logout, etc.). An empty string selects the default endpoint of aurelia-api.
    endpoint = null;
    // When authenticated, these endpoints will have the token added to the header of any requests (for authorization). Accepts an array of endpoint names. An empty string selects the default endpoint of aurelia-api.
    configureEndpoints = null;


    // SPA related options
    // ===================

    // The SPA url to which the user is redirected after a successful login
    loginRedirect = '#/';
    // The SPA url to which the user is redirected after a successful logout
    logoutRedirect = '#/';
    // The SPA route used when an unauthenticated user tries to access an SPA page that requires authentication
    loginRoute = '/login';
    // Whether or not an authentication token is provided in the response to a successful signup
    loginOnSignup = true;
    // If loginOnSignup == false: The SPA url to which the user is redirected after a successful signup (else loginRedirect is used)
    signupRedirect = '#/login';
    // redirect  when token expires. 0 = don't redirect (default), 1 = use logoutRedirect, string = redirect there
    expiredRedirect = 0;


    // API related options
    // ===================

    // The base url used for all authentication related requests, including provider.url below.
    // This appends to the httpClient/endpoint base url, it does not override it.
    baseUrl = '';
    // The API endpoint to which login requests are sent
    loginUrl = '/auth/login';
    // The API endpoint to which logout requests are sent (not needed for jwt)
    logoutUrl = null;
    // The HTTP method used for 'unlink' requests (Options: 'get' or 'post')
    logoutMethod = 'get';
    // The API endpoint to which signup requests are sent
    signupUrl = '/auth/signup';
    // The API endpoint used in profile requests (inc. `find/get` and `update`)
    profileUrl = '/auth/me';
    // The method used to update the profile ('put' or 'patch')
    profileMethod = 'put';
    // The API endpoint used with oAuth to unlink authentication
    unlinkUrl = '/auth/unlink/';
    // The HTTP method used for 'unlink' requests (Options: 'get' or 'post')
    unlinkMethod = 'get';
    // The API endpoint to which refreshToken requests are sent. null = loginUrl
    refreshTokenUrl = null;


    // Token Options
    // =============

    // The header property used to contain the authToken in the header of API requests that require authentication
    authHeader = 'Authorization';
    // The token name used in the header of API requests that require authentication
    authTokenType = 'Bearer';
    // The the property from which to get the access token after a successful login or signup. Can also be dotted eg "accessTokenProp.accessTokenName"
    accessTokenProp = 'access_token';


    // If the property defined by `accessTokenProp` is an object:
    // ------------------------------------------------------------

    //This is the property from which to get the token `{ "accessTokenProp": { "accessTokenName" : '...' } }`
    accessTokenName = 'token';
    // This allows the token to be a further object deeper `{ "accessTokenProp": { "accessTokenRoot" : { "accessTokenName" : '...' } } }`
    accessTokenRoot = false;


    // Refresh Token Options
    // =====================

    // Option to turn refresh tokens On/Off
    useRefreshToken = false;
    // The option to enable/disable the automatic refresh of Auth tokens using Refresh Tokens
    autoUpdateToken = true;
    // Oauth Client Id
    clientId = false;
    // The the property from which to get the refresh token after a successful token refresh. Can also be dotted eg "refreshTokenProp.refreshTokenProp"
    refreshTokenProp = 'refresh_token';

    // If the property defined by `refreshTokenProp` is an object:
    // -----------------------------------------------------------

    // This is the property from which to get the token `{ "refreshTokenProp": { "refreshTokenName" : '...' } }`
    refreshTokenName = 'token';
    // This allows the refresh token to be a further object deeper `{ "refreshTokenProp": { "refreshTokenRoot" : { "refreshTokenName" : '...' } } }`
    refreshTokenRoot = false;


    // Miscellaneous Options
    // =====================

    // Whether to enable the fetch interceptor which automatically adds the authentication headers
    // (or not... e.g. if using a session based API or you want to override the default behaviour)
    httpInterceptor = true;
    // Controls how the popup is shown for different devices (Options: 'browser' or 'mobile')
    platform = 'browser';
    // Determines the `PLATFORM` property name upon which aurelia-authentication data is stored (Default: `PLATFORM.localStorage`)
    storage = 'localStorage';
    // The key used for storing the authentication response locally
    storageKey = 'aurelia_authentication';

    // The resource name on the default authentication endpoint (the endpoint property here) which
    // gives us the providers.
    providersResource = '';

    // A function that maps providers returned from the endpoint to the structure required here.
    providersMapper = p => p;

    async getProviders () {
        if (this.providers) {
            return this.providers;
        }

        let sourceProviders = await this.client.find(this.providersResource);
        this.providers = {};
        for (let name in sourceProviders) {
            let sourceProvider = sourceProviders[name];
            let targetProvider = {
                name: name,
                responseType: "id_token",
                requiredUrlParams: ["display", "scope", "nonce", "state", "redirect_uri"],
                redirectUri: PLATFORM.location.origin,
                state: randomState,
                nonce: randomState,
                scope: ["profile", "email"],
                scopePrefix: "openid",
                scopeDelimiter: " ",
                oauthType: "2.0",
                display: "popup",
            };

            this.providers[name] = Object.assign(targetProvider, this.providersMapper(sourceProvider));
        }

        return this.providers;
    }

    // The resource name on the default authentication endpoint used to exchange an ID Token for an access token.
    tokenExchangeResource = "";
}

function randomState() {
    let rand = Math.random().toString(36).substr(2);
    return encodeURIComponent(rand);
}
