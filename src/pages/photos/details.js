import {inject, NewInstance} from "aurelia-framework";
import {Endpoint} from "aurelia-api";

@inject(Endpoint.of("main"))
export class Details {

    exifData = [];
    thumbnail;

    constructor (endpoint) {
        this._endpoint = endpoint;
    }

    async activate (params) {
        // TODO: Should be able to use findOne here and specify params.id as the second parameter
        let exifDataLookup = await this._endpoint.find(`photo-exif-data/${params.id}`, {
            includeThumbnails: true
        });

        for (let property in exifDataLookup) {
            this.exifData.push({
                property: property,
                value: exifDataLookup[property]
            });
        }

        this.thumbnail = exifDataLookup.ThumbnailImage.substring("base64:".length);
    }
}