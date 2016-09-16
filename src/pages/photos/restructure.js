import {inject, NewInstance} from "aurelia-framework";
import {Endpoint} from "aurelia-api";
import base64url from "base64-url";

@inject(Endpoint.of("main"))
export class Restructure {

    directoryPaths;

    constructor (endpoint) {
        this._endpoint = endpoint;
    }

    async activate (params) {
        let pathLookup = await this._endpoint.find("photo-movement");

        this.directoryPaths = [];
        for (let path in pathLookup) {
            this.directoryPaths.push({
                pathParam: base64url.encode(path),
                path: path,
                count: pathLookup[path].length
            });
        }
    }
}