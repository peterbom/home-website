function getNonce() {
    return encodeURIComponent(
        ((Date.now() + Math.random()) * Math.random())
        .toString()
        .replace(".", "")
    );
}

export default {
    endpoint: "internal",   // Endpoint for aurelia-authentication
    configureEndpoints: ["internal", "another"],    // add Authorization headers to those for authenticated requests
    baseUrl: "",  // server url. already set in main.js to http://192.168.1.230:8000
    httpInterceptor: true, // true=add auth token to httpInterceptor
    loginUrl: "login",  // api login url
    loginRoute: "/login", // ???
    // signupUrl: "users", // api signup url
    profileUrl: "me",   // api profile url
    // unlinkUrl: "me/unlink", // api unlink third-party url
    loginOnSignup: false,
    // loginRedirect: "#/profile", // internal aurelia redirect root
    // signupRedirect: "#/login",  // internal aurelia redirect root
    // logoutRedirect: "#/login",
    expiredRedirect: 1, // redirect to logoutRedirect after token expiration
    useRefreshToken: false,

    providers: {
        outlook: {
            name: "outlook",
            url: "", // api route to outlook methods
            clientId: "000000004C16745D",
            authorizationEndpoint: "https://login.microsoftonline.com/common/oauth2/v2.0/authorize",
            responseType: "id_token",
            requiredUrlParams: ["display", "scope", "nonce", "state"],
            state: function() {
                return Math.random(); // this just an example
            },
            nonce: getNonce(),
            scope: ["profile", "email"],
            scopePrefix: "openid",
            scopeDelimiter: " ",
            oauthType: "2.0",
            display: "popup",
            popupOptions: { width: 580, height: 400 }
        },
        google: {
            name: "google",
            url: "/auth/google",
            clientId: "569253544793-jg6vhjl8q9h7blta967pdv0ao4qmlrra.apps.googleusercontent.com",
            authorizationEndpoint: "https://accounts.google.com/o/oauth2/v2/auth",
            scope: ["profile", "email"],
            scopePrefix: "openid",
            scopeDelimiter: " ",
            oauthType: "2.0",
            display: "popup",
            popupOptions: { width: 452, height: 633 }
        }
    }
};