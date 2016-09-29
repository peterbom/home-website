import {inject, NewInstance, BindingEngine} from "aurelia-framework";
import {Endpoint} from "aurelia-api";
import {DialogService} from "aurelia-dialog";
import moment from "moment";
import base64url from "base64-url";

@inject(BindingEngine, Endpoint.of("main"), DialogService)
export class Search {

    constructor (bindingEngine, endpoint, dialogService) {
        this._bindingEngine = bindingEngine;
        this._endpoint = endpoint;
        this._dialogService = dialogService;
    }

    pathParam;
    path;
    fromDateTime;
    toDateTime;

    images;
    selectedImages = [];

    thumbnailLookup = {};

    subscriptions = [];

    selectedOperation = "edit-date";
    operationOptions = [
        {value: "edit-date", name: "Edit Taken Date"},
        {value: "edit-tags", name: "Edit Tags"}
    ];

    set allSelected (val) {
        if (val) {
            this.selectedImages = (this.images || []).slice();
        } else {
            this.selectedImages = [];
        }
    }

    get allSelected () {
        return this.images &&
            this.selectedImages &&
            this.selectedImages.length === this.images.length;
    }

    async activate (params) {
        if (params.path) {
            this.pathParam = params.path;
            this.path = base64url.decode(params.path);
        } else {
            this.fromDateTime = moment().subtract(30, "days").toDate();
            this.toDateTime = moment().endOf("day").toDate();
        }

        // Call but don't await the applyFilters function. The view should handle this.images
        // being uninitialized.
        window.setTimeout(() => this.applyFilters(), 100);
    }

    async applyFilters() {
        let controller = await this._dialogService.openAndYieldController({
            viewModel: this.loadingModal,
            model: "Loading"
        });

        let criteria = {
            path: this.path,
            fromDateTime: this.fromDateTime && this.fromDateTime.toISOString(),
            toDateTime: this.toDateTime && this.toDateTime.toISOString()
        };

        this.subscriptions.forEach(s => s.dispose());
        this.subscriptions = [];

        this.images = await this._endpoint.find("photo-image", {
            json: JSON.stringify({
                criteria: criteria
            })
        });
        
        this.images.forEach(i => {
            i.pathParam = base64url.encode(i.directoryPath);

            // http://ilikekillnerds.com/2015/10/observing-objects-and-arrays-in-aurelia/
            this.subscriptions.push(this._bindingEngine.propertyObserver(i, "takenDateTime")
                .subscribe(() => i.takenDateTimeChanged = true));

            this.subscriptions.push(this._bindingEngine.collectionObserver(i.tags)
                .subscribe(splices => i.tagsSplices = splices));
        });

        controller.cancel();

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
    }

    isUpdated(image) {
        switch (this.selectedOperation) {
            case "edit-date":
                return image.takenDateTimeChanged === true;
            case "edit-tags":
                return !!image.tagsSplices;
            default:
                throw new Error(`unexpected operation: ${this.selectedOperation}`);
        }
    }

    async sendToPhotoFrame() {
        let controller = await this._dialogService.openAndYieldController({
            viewModel: this.loadingModal,
            model: {
                message: "Clearing images on photo frame",
                progressPercent: 0
            }
        });

        await this._endpoint.destroy("photo-frame");

        controller.viewModel.message = "Sending images to photo frame";
        controller.viewModel.progressPercent = 10;

        // create batches
        let remainingImages = this.selectedImages;
        while (remainingImages.length > 0) {
            let batch = remainingImages.splice(0, 10);

            await this._endpoint.post("photo-frame", { ids: batch.map(i => i.id) });
            controller.viewModel.progressPercent += (batch.length / this.selectedImages.length) * 90;
        }

        controller.cancel();
    }

    async saveTakenDates() {
        await this.saveUpdates("DateTimeOriginal", "date", i => i.takenDateTime);
    }

    async saveTags() {
        await this.saveUpdates("Tags", "string-array", i => i.tags);
    }

    async saveUpdates(propertyName, propertyType, valueGetter) {
        let updatedImages = this.images.filter(i => this.isUpdated(i));
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
                value: valueGetter(i)
            }));

            await this._endpoint.post("photo-exif-data", {
                propertyName: propertyName,
                type: propertyType,
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

        await this.applyFilters();

        controller.cancel();
    }
}