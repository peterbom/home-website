import {inject, NewInstance} from "aurelia-framework";
import {Endpoint} from "aurelia-api";

@inject(Endpoint.of("main"))
export class Restructure {
    constructor (endpoint) {
        this._endpoint = endpoint;
    }

    async activate (params) {
    }
}