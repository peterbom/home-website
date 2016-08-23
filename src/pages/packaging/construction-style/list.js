import {inject}   from "aurelia-framework";
import {Endpoint} from "aurelia-api";

@inject(Endpoint.of("packaging"))
export class List {

    constructionStyles = [];

    constructor (endpoint) {
        this._endpoint = endpoint;
    }

    async activate () {
        this.constructionStyles = await this._endpoint.find("construction-style");
    }
}