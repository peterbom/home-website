import {PLATFORM} from "aurelia-pal";
import {Config as ApiConfig} from "aurelia-api";
import {BindingSignaler} from "aurelia-templating-resources";
import {EventAggregator} from "aurelia-event-aggregator";
import Auth0Lock from "auth0-lock";

import {AuthChangeNotifier} from "./auth-change-notifier";
import {Storage} from "./storage";
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

    // Dependencies which can be resolved by the container (i.e. need no more custom configuration)
    let apiConfig = aurelia.container.get(ApiConfig);
    let storage = aurelia.container.get(Storage);
    let bindingSignaler = aurelia.container.get(BindingSignaler);
    let eventAggregator = aurelia.container.get(EventAggregator);

    // Create other dependencies according to configuration
    let auth0Lock = new Auth0Lock(settings.auth0ClientId, settings.auth0Domain, {
        auth: {
            params: {
                scope: 'openid email' // Learn about scopes: https://auth0.com/docs/scopes
            }
        }
    });
    let permissionsEndpoint = apiConfig.getEndpoint(settings.permissionsEndpoint);
    let tokenManager = new TokenManager(storage);
    let authChangeNotifier = new AuthChangeNotifier(bindingSignaler, eventAggregator);
    let authenticationManager = new AuthenticationManager(
        auth0Lock,
        permissionsEndpoint,
        tokenManager,
        authChangeNotifier,
        settings);
    let fetchConfig = new FetchConfig(apiConfig, authenticationManager, settings.securedEndpoints);

    // Register all new'ed up dependencies with the container so we always resolve
    // the same instances in future.
    aurelia.container.registerInstance(Auth0Lock, auth0Lock);
    aurelia.container.registerInstance(TokenManager, tokenManager);
    aurelia.container.registerInstance(AuthChangeNotifier, authChangeNotifier);
    aurelia.container.registerInstance(AuthenticationManager, authenticationManager);
    aurelia.container.registerInstance(FetchConfig, fetchConfig);

    aurelia.container.registerInstance("authentication-manager", authenticationManager);
}
