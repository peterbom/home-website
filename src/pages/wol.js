import {inject, NewInstance} from "aurelia-framework";
import {Endpoint} from "aurelia-api";

@inject(Endpoint.of("main"))
export class Wol {
    constructor (endpoint) {
        this._endpoint = endpoint;
    }

    async wake (machine) {
        // update translates to PUT
        await this._endpoint.update("wol", machine);
    }
}