import {inject, NewInstance} from "aurelia-framework";
import {Endpoint} from "aurelia-api";

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
                path: path,
                count: pathLookup[path].length
            });
        }
    }
}