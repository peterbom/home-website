import {inject, NewInstance} from "aurelia-framework";
import {Endpoint} from "aurelia-api";

@inject(Endpoint.of("main"))
export class ResolveDuplicates {

    duplicateImages = [];
    distinctImages = [];
    thumbnailLookup = {};

    constructor (endpoint) {
        this._endpoint = endpoint;
    }

    async activate (params) {
        let hash = params.id;
        this.duplicateImages = await this._endpoint.find("photo-duplicate", hash);

        let thumbnails = await this._endpoint.find("photo-exif-data", {
            json: JSON.stringify({
                imageHash: hash,
                thumbnailsOnly: true
            })
        });

        for (let imageId in thumbnails) {
            this.thumbnailLookup[imageId] = thumbnails[imageId].ThumbnailImage.substring("base64:".length);
        }
    }
}