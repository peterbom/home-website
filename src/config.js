
let mainEndpoint;
let devEndpoint;
let packagingEndpoint;

switch (window.env.NODE_ENV) {
    case "development":
    case "test":
        mainEndpoint = "http://localhost:8000/";
        packagingEndpoint = "http://localhost:37081/";
        break;
    case "staging":
        mainEndpoint = "https://testapi.bombers.space/";
        packagingEndpoint = "http://localhost:37081/";  // Invalid hostname from IIS Express if we use IP address
        break;
    case "production":
        mainEndpoint = "https://api.bombers.space/";
        packagingEndpoint = "https://packagingapi.azurewebsites.net/";
        break;
    default:
        throw new Error(`Unexpected environment ${window.env.NODE_ENV}`);
}

export let apiConfig = {
    mainEndpoint: mainEndpoint,
    devEndpoint: devEndpoint,
    packagingEndpoint: packagingEndpoint
};

export let authConfig = {
    auth0ClientId: "DwlKF4GYbw3BIc2Eo6PRJXiHyG0Lr8L7",
    auth0Domain: "bomb.au.auth0.com",
    permissionsEndpoint: "main",
    permissionsResource: "permission",
    securedEndpoints: ["main", "packaging"],    // add Authorization headers to those for authenticated requests
    expiredRedirectUrl: "#/login",
    logoutRedirectUrl: ""
};