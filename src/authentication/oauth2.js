import {inject} from 'aurelia-dependency-injection';
import {buildQueryString} from 'aurelia-path';

import {Storage} from './storage';
import {Popup} from './popup';
import {BaseConfig} from './base-config';

@inject(Storage, Popup, BaseConfig)
export class OAuth2 {
    constructor(storage, popup, config) {
        this.storage      = storage;
        this.config       = config;
        this.popup        = popup;
        this.defaults     = {
            url: null,
            name: null,
            state: null,
            scope: null,
            scopeDelimiter: null,
            redirectUri: null,
            popupOptions: null,
            authorizationEndpoint: null,
            responseParams: null,
            requiredUrlParams: null,
            optionalUrlParams: null,
            defaultUrlParams: ['response_type', 'client_id', 'redirect_uri'],
            responseType: 'code'
        };
    }

    async open(options, userData) {
        const provider  = Object.assign({}, this.defaults, options);
        const stateName = provider.name + '_state';

        if (typeof provider.state === 'function') {
            this.storage.set(stateName, provider.state());
        } else if (typeof provider.state === 'string') {
            this.storage.set(stateName, provider.state);
        }

        const url = provider.authorizationEndpoint + '?' + buildQueryString(this.buildQuery(provider));
        const popup = await this.popup.open(url, provider.name, provider.popupOptions);
        let oauthData = await popup.pollPopup();

        if (!oauthData.id_token) {
            throw new Error(`Returned data ${JSON.stringify(oauthData, null, 2)} does not contain id_token`);
        }

        if (oauthData.state && oauthData.state !== this.storage.get(stateName)) {
            throw new Error('OAuth 2.0 state parameter mismatch.');
        }

        // Exchange the ID token for an access token
        let tokenExchangeData = {
            id_token: oauthData.id_token
        };

        return await this.config.client.post(this.config.tokenExchangeResource, tokenExchangeData);
    }

    buildQuery(provider) {
        let query = {};
        const urlParams   = ['defaultUrlParams', 'requiredUrlParams', 'optionalUrlParams'];

        urlParams.forEach( params => {
            (provider[params] || []).forEach( paramName => {
                const camelizedName = camelCase(paramName);
                let paramValue      = (typeof provider[paramName] === 'function')
                                                            ? provider[paramName]()
                                                            : provider[camelizedName];

                if (paramName === 'state') {
                    paramValue = encodeURIComponent(this.storage.get(provider.name + '_state'));
                }

                if (paramName === 'scope' && Array.isArray(paramValue)) {
                    paramValue = paramValue.join(provider.scopeDelimiter);

                    if (provider.scopePrefix) {
                        paramValue = provider.scopePrefix + provider.scopeDelimiter + paramValue;
                    }
                }

                query[paramName] = paramValue;
            });
        });
        return query;
    }
}

const camelCase = function(name) {
    return name.replace(/([\:\-\_]+(.))/g, function(_, separator, letter, offset) {
        return offset ? letter.toUpperCase() : letter;
    });
};
