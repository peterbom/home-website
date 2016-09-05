import {inject, NewInstance} from "aurelia-framework";
import {Endpoint} from "aurelia-api";

@inject(Endpoint.of("main"))
export class Duplicates {

    duplicates = [];

    constructor (endpoint) {
        this._endpoint = endpoint;
    }

    async activate (params) {
        let duplicateLookup = await this._endpoint.find("photo-duplicate");
        for (let hash in duplicateLookup) {
            this.duplicates.push({
                hash: hash,
                images: duplicateLookup[hash]
            });
        }
    }
}