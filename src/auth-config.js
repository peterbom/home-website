export default {
    endpoint: "main",   // Used to set "client" on the BaseConfig instance
    configureEndpoints: ["main", "dev"],    // add Authorization headers to those for authenticated requests
    baseUrl: "",  // server url. already set in main.js to http://192.168.1.230:8000
    providersResource: "authentication",
    providersMapper: p => ({
        clientId: p.clientId,
        authorizationEndpoint: p.authorizationEndpoint,
        popupOptions: { width: p.popupWidth, height: p.popupHeight }
    }),
    tokenExchangeResource: "authentication",
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
    useRefreshToken: false
};