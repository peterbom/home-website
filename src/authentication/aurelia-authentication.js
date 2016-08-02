import {PLATFORM} from 'aurelia-pal';
import {HttpClient} from 'aurelia-fetch-client';
import {Config, Rest} from 'aurelia-api';
import * as LogManager from 'aurelia-logging';

import {BaseConfig} from './base-config';
import {FetchConfig} from './fetch-client-config';

/**
 * Configure the plugin.
 *
 * @param {{globalResources: Function, container: {Container}}} aurelia
 * @param {{}|Function}                                         config
 */
export function configure(aurelia, config) {
    // ie9 polyfill
    if (!PLATFORM.location.origin) {
        PLATFORM.location.origin = PLATFORM.location.protocol + '//' + PLATFORM.location.hostname + (PLATFORM.location.port ? ':' + PLATFORM.location.port : '');
    }

    const baseConfig = aurelia.container.get(BaseConfig);

    baseConfig.configure(config);

    const fetchConfig  = aurelia.container.get(FetchConfig);
    const clientConfig = aurelia.container.get(Config);

    // Array? Configure the provided endpoints.
    if (Array.isArray(baseConfig.configureEndpoints)) {
        baseConfig.configureEndpoints.forEach(endpointToPatch => {
            fetchConfig.configure(endpointToPatch);
        });
    }

    let client;

    // Let's see if there's a configured named or default endpoint or a HttpClient.
    if (baseConfig.endpoint !== null) {
        if (typeof baseConfig.endpoint === 'string') {
            const endpoint = clientConfig.getEndpoint(baseConfig.endpoint);
            if (!endpoint) {
                throw new Error(`There is no '${baseConfig.endpoint || 'default'}' endpoint registered.`);
            }
            client = endpoint;
        } else if (baseConfig.endpoint instanceof HttpClient) {
            client = new Rest(baseConfig.endpoint);
        }
    }

    // No? Fine. Default to HttpClient. BC all the way.
    if (!(client instanceof Rest)) {
        client = new Rest(aurelia.container.get(HttpClient));
    }

    // Set the client on the config, for use throughout the plugin.
    baseConfig.client = client;
}
