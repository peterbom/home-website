import {inject, NewInstance} from "aurelia-framework";
import {DialogService} from "aurelia-dialog";
import moment from "moment";

@inject("image-service", DialogService, "page-manager")
export class Search {

    constructor (imageService, dialogService, pageManager) {
        this._imageService = imageService;
        this._dialogService = dialogService;
        this._pageManager = pageManager;

        this.resizedImageContainerUri = null;
        this.videosForWebContainerUri = null;

        this.fromDateTime = null;
        this.toDateTime = null;
        this.images = null;
        this.selectedImages = [];
        this.pageSet = null;
        this.pageLinkGenerator = null;
    }

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
        this.resizedImageContainerUri = await this._imageService.getResizedImageContainerUri();
        this.videosForWebContainerUri = await this._imageService.getVideosForWebContainerUri();

        this.fromDateTime = moment().subtract(30, "days").toDate();
        this.toDateTime = moment().endOf("day").toDate();

        // Call but don't await the applyFilters function. The view should handle this.images
        // being uninitialized.
        window.setTimeout(() => this.applyFilters(), 100);
    }

    async applyFilters() {
        let controller = await this._dialogService.openAndYieldController({
            viewModel: this.loadingModal,
            model: "Loading"
        });

        var imageNames = await this._imageService.search({
            fromLocal: this.fromDateTime && this.fromDateTime.toISOString(),
            toLocal: this.toDateTime && this.toDateTime.toISOString()
        });

        let images = [];
        let imageLookup = {};
        for (let name of imageNames) {
            let image = {
                name: name,
                mimeType: null,
                thumbnailUrl: null,
                sizes: []
            };

            images.push(image);
            imageLookup[name] = image;
        }

        this.images = images;

        this.pageSet = this._pageManager.getPageSet(this.images);
        this.pageLinkGenerator = this._pageManager.getPageLinkGenerator(this.pageSet, 10);

        controller.cancel();

        // Retrieve image data in batches
        let batchSize = 100;
        while (imageNames.length) {
            let batch = imageNames.splice(0, batchSize);
            let batchResults = await this._imageService.retrieve(batch, {
                sizes: true
            });

            batchResults.forEach(result => {
                let image = imageLookup[result.name];
                image.mimeType = result.mimeType;
                image.sizes = result.sizes.slice();
            });
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
}