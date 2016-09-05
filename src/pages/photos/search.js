import {inject, NewInstance} from "aurelia-framework";
import {Endpoint} from "aurelia-api";

@inject(Endpoint.of("main"))
export class Search {
    constructor (endpoint) {
        this._endpoint = endpoint;
    }

    async activate (params) {
        if (params.path) {
            let images = await this._endpoint.find("photo-image", params.path);
        }
    }
}