
let mainEndpoint;
let devEndpoint;

switch (window.env.NODE_ENV) {
    case "development":
        mainEndpoint = "http://localhost:8000/";
        devEndpoint = "http://localhost:16000/";
        break;
    case "test":
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
    devEndpoint: devEndpoint,
    packagingEndpoint: "https://packagingapi.azurewebsites.net/"
};

export let authConfig = {
    auth0ClientId: "DwlKF4GYbw3BIc2Eo6PRJXiHyG0Lr8L7",
    auth0Domain: "bomb.au.auth0.com",
    permissionsEndpoint: "main",
    permissionsResource: "permission",
    securedEndpoints: ["main", "dev", "packaging"],    // add Authorization headers to those for authenticated requests
    expiredRedirectUrl: "#/login",
    logoutRedirectUrl: ""
};