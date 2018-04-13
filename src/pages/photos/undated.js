import {inject, NewInstance} from "aurelia-framework";
import {DialogService} from "aurelia-dialog";
import moment from "moment";

@inject("image-service", DialogService)
export class Undated {

    constructor (imageService, dialogService) {
        this._imageService = imageService;
        this._dialogService = dialogService;

        this.resizedImageContainerUri = null;
        this.videosForWebContainerUri = null;

        this.images = null;
    }

    async activate () {
        this.resizedImageContainerUri = await this._imageService.getResizedImageContainerUri();
        this.videosForWebContainerUri = await this._imageService.getVideosForWebContainerUri();

        await this.refreshImages();
    }

    async refreshImages () {
        let criteria = {
            missingAttributes: ["TakenUtc", "TakenLocal"]
        };

        let names = await this._imageService.search(criteria);

        let includes = {
            takenDateTime: true,
            owner: true,
            position: true
        };

        this.images = await this._imageService.retrieve(names, includes);
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

        await this.refreshImages();

        controller.cancel();
    }
}