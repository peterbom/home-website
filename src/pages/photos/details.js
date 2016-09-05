import {inject, NewInstance} from "aurelia-framework";
import {Endpoint} from "aurelia-api";

@inject(Endpoint.of("main"))
export class Details {
    constructor (endpoint) {
        this._endpoint = endpoint;
    }

    async activate (params) {
    }
}