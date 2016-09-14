import {inject, NewInstance} from "aurelia-framework";
import {Endpoint} from "aurelia-api";
import {DialogService} from "aurelia-dialog";
import moment from "moment";

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
            while (imageIds.length > 0) {
                let batch = imageIds.splice(0, 20);

                let batchResults = await this._endpoint.find("photo-exif-data", {
                    json: JSON.stringify({
                        ids: batch,
                        thumbnailsOnly: true
                    })
                });

                for (let imageId in batchResults) {
                    let imageString = batchResults[imageId].ThumbnailImage;
                    this.thumbnailLookup[imageId] = imageString ? imageString.substring("base64:".length) : null;
                }
            }
        };

        // Call but don't await the initialize function. The view should handle this.thumbnailLookup
        // being uninitialized.
        window.setTimeout(initializeThumbnails, 100);
    }

    async save () {
        let updatedImages = this.images.filter(i => i.takenDateTime);
        if (!updatedImages.length) {
            return;
        }

        let controller = await this._dialogService.openAndYieldController({
            viewModel: this.loadingModal,
            model: {
                message: "Updating",
                progressPercent: 0
            }
        });

        // create batches
        let batches = [];
        while (updatedImages.length > 0) {
            batches.push(updatedImages.splice(0, 10));
        }

        for (let i = 0; i < batches.length; i++) {
            let batch = batches[i];

            let updates = batch.map(i => ({
                id: i.id,
                value: i.takenDateTime
            }));

            await this._endpoint.post("photo-exif-data", {
                propertyName: "DateTimeOriginal",
                type: "date",
                updates: updates
            });

            controller.viewModel.progressPercent = ((i + 1) / batches.length) * 50;
        }

        controller.viewModel.message = "Re-indexing";
        for (let i = 0; i < batches.length; i++) {
            let batch = batches[i];

            await this._endpoint.post("photo-index", {
                imageIds: batch.map(i => i.id),
                operation: "index"
            });

            controller.viewModel.progressPercent = 50 + ((i + 1) / batches.length) * 50;
        }

        controller.cancel();
    }
}