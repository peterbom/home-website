
let mainEndpoint;
let devEndpoint;

switch (window.env.NODE_ENV) {
    case "development":
        mainEndpoint = "http://192.168.1.230:20080/";
        devEndpoint = "http://192.168.1.200:20080/";
        break;
    case "production":
        mainEndpoint = "https://pi.bombers.space/";
        devEndpoint = "https://dev.bombers.space/";
        break;
    default:
        throw new Error(`Unexpected environment ${window.env.NODE_ENV}`);
}

export let apiConfig = {
    mainEndpoint: mainEndpoint,
    devEndpoint: devEndpoint
};

export let authConfig = {
    authEndpoint: "main",   // Used to set "client" on the BaseConfig instance
    securedEndpoints: ["main", "dev"],    // add Authorization headers to those for authenticated requests
    authApiClientSettings: {
        providersResource: "authentication",
        tokenExchangeResource: "authentication",
    },
    urlSettings: {
        expiredRedirectUrl: "#/login",
        logoutRedirectUrl: ""
    }
};