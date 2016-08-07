import {PLATFORM} from "aurelia-pal";
import {Config as ApiConfig} from "aurelia-api";
import {BindingSignaler} from "aurelia-templating-resources";
import {EventAggregator} from "aurelia-event-aggregator";
import {Log as OidcLog} from "oidc-client";

import {Storage} from "./storage";
import {AuthApiClient} from "./auth-api-client";
import {ProviderManager} from "./provider-manager";
import {TokenManager} from "./token-manager";
import {AuthenticationManager} from "./authentication-manager";
import {FetchConfig} from './fetch-config';

/**
 * Configure the plugin.
 *
 * @param {{globalResources: Function, container: {Container}}} aurelia
 * @param {{}}                                         settings
 */
export function configure(aurelia, settings) {
    // ie9 polyfill
    // TODO: Is this required??
    if (!PLATFORM.location.origin) {
        PLATFORM.location.origin = PLATFORM.location.protocol + '//' + PLATFORM.location.hostname + (PLATFORM.location.port ? ':' + PLATFORM.location.port : '');
    }

    if (!settings.authEndpoint) {
        throw new Error("There is no 'authEndpoint' endpoint configured.");
    }

    // TODO: Merge OIDC logging into project logging
    OidcLog.logger = console;

    // Dependencies which can be resolved by the container (i.e. need no more custom configuration)
    let apiConfig = aurelia.container.get(ApiConfig);
    let storage = aurelia.container.get(Storage);
    let bindingSignaler = aurelia.container.get(BindingSignaler);
    let eventAggregator = aurelia.container.get(EventAggregator);

    // Create other dependencies according to configuration
    let authEndpoint = apiConfig.getEndpoint(settings.authEndpoint);
    let authApiClient = new AuthApiClient(authEndpoint, settings.authApiClientSettings);
    let providerManager = new ProviderManager(authApiClient, storage);
    let tokenManager = new TokenManager(storage);
    let authenticationManager = new AuthenticationManager(
        authApiClient,
        providerManager,
        tokenManager,
        bindingSignaler,
        eventAggregator,
        settings.urlSettings);
    let fetchConfig = new FetchConfig(apiConfig, authenticationManager, settings.securedEndpoints);

    // Register all new'ed up dependencies with the container so we always resolve
    // the same instances in future.
    aurelia.container.registerInstance(AuthApiClient, authApiClient);
    aurelia.container.registerInstance(TokenManager, tokenManager);
    aurelia.container.registerInstance(ProviderManager, providerManager);
    aurelia.container.registerInstance(AuthenticationManager, authenticationManager);
    aurelia.container.registerInstance(FetchConfig, fetchConfig);

    // Must be registered after registering AuthenticationManager in the DI container
    aurelia.globalResources("authentication/auth-filter-value-converter");
}
