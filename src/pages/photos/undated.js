import {inject, NewInstance} from "aurelia-framework";
import {Endpoint} from "aurelia-api";
import {DialogService} from "aurelia-dialog";

@inject(Endpoint.of("main"), DialogService)
export class Undated {

    images;

    thumbnailLookup = {};

    constructor (endpoint, dialogService) {
        this._endpoint = endpoint;
        this._dialogService = dialogService;
    }

    async activate () {
        this.images = await this._endpoint.find("photo-image", {
            json: JSON.stringify({
                missingTakenDate: true
            })
        });

        let initializeThumbnails = async () => {
            let imageIds = this.images.map(i => i.id);

            // Retrieve thumbnails in batches
            let batches = [];
            while (imageIds.length > 0) {
                batches.push(imageIds.splice(0, 50));
            }

            let processBatch = async ids => {
                let batchResults = await this._endpoint.find("photo-exif-data", {
                    json: JSON.stringify({
                        ids: ids,
                        thumbnailsOnly: true
                    })
                });

                for (let imageId in batchResults) {
                    let imageString = batchResults[imageId].ThumbnailImage;
                    this.thumbnailLookup[imageId] = imageString ? imageString.substring("base64:".length) : null;
                }
            };

            await Promise.all(batches.map(processBatch));
        };

        // Call but don't await the initialize function. The view should handle this.thumbnailLookup
        // being uninitialized.
        window.setTimeout(initializeThumbnails, 100);
    }
}