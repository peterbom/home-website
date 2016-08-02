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

    // Configure the provided endpoints.
    baseConfig.configureEndpoints.forEach(endpointToPatch => {
        fetchConfig.configure(endpointToPatch);
    });

    // Let's see if there's a configured named or default endpoint or a HttpClient.
    // This gives us an aurelia-api Rest endpoint
    baseConfig.client = clientConfig.getEndpoint(baseConfig.endpoint);
    if (!baseConfig.client) {
        throw new Error(`There is no '${baseConfig.endpoint}' endpoint registered.`);
    }
}
