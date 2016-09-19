import {inject, NewInstance} from "aurelia-framework";
import {Endpoint} from "aurelia-api";
import base64url from "base64-url";

@inject(Endpoint.of("main"))
export class Restructure {

    directories;

    constructor (endpoint) {
        this._endpoint = endpoint;
    }

    async activate (params) {
        this.directories = await this._endpoint.find("photo-movement");
        this.directories.forEach(d => d.pathParam = base64url.encode(d.directoryPath));
    }
}