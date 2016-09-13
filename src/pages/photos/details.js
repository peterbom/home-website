import {inject, NewInstance} from "aurelia-framework";
import {Endpoint} from "aurelia-api";

@inject(Endpoint.of("main"))
export class Details {

    image;
    exifData = [];
    thumbnail;

    constructor (endpoint) {
        this._endpoint = endpoint;
    }

    async activate (params) {
        // TODO: Should be able to use findOne here and specify params.id as the second parameter
        let promises = [
            this._endpoint.find(`photo-image/${params.id}`),
            this._endpoint.find(`photo-exif-data/${params.id}`, {thumbnailsOnly: true}),
            this._endpoint.find(`photo-exif-data/${params.id}`, {includeThumbnails: false})
        ];

        let imageData = await Promise.all(promises);
        this.image = imageData[0];
        let thumbnailImage = imageData[1].ThumbnailImage;
        let exifDataLookup = imageData[2];

        this.thumbnail = thumbnailImage ? thumbnailImage.substring("base64:".length) : null;

        for (let property in exifDataLookup) {
            this.exifData.push({
                property: property,
                value: exifDataLookup[property]
            });
        }
    }
}