import {inject, NewInstance} from "aurelia-framework";
import {Endpoint} from "aurelia-api";
import {DialogService} from "aurelia-dialog";
import base64url from "base64-url";

@inject(Endpoint.of("main"), DialogService)
export class MoveFromDir {

    pathParam;
    directoryPath;

    images = null;
    selectedImages = [];

    set allSelected (val) {
        if (val) {
            this.selectedImages = (this.images || []).slice().filter(i => i.canMove);
        } else {
            this.selectedImages = [];
        }
    }

    get allSelected () {
        return this.images &&
            this.selectedImages &&
            this.selectedImages.length === this.images.length;
    }

    constructor (endpoint, dialogService) {
        this._endpoint = endpoint;
        this._dialogService = dialogService;
    }

    async activate (params) {
        this.pathParam = params.path;
        this.directoryPath = base64url.decode(params.path);

        this.images = await this._endpoint.find("photo-movement", encodeURIComponent(this.directoryPath));
        this.images.forEach(i => {
            i.canMove = !i.fileExists && !i.hasDuplicate;
            i.current.pathParam = base64url.encode(i.current.directoryPath);
            i.destination.pathParam = base64url.encode(i.destination.directoryPath);
        });
    }

    async move () {
        if (this.selectedImages.length === 0) {
            return;
        }

        // Perform move in batches
        let batches = [];
        let selectedImages = this.selectedImages;
        while (selectedImages.length > 0) {
            batches.push(selectedImages.splice(0, 20));
        }

        let controller = await this._dialogService.openAndYieldController({
            viewModel: this.loadingModal,
            model: {
                message: "Moving files",
                progressPercent: 0
            }});

        for (let batch of batches) {
            let promises = batch.map(image => this._endpoint.update("photo-movement", image.id));

            await Promise.all(promises);
            controller.viewModel.progressPercent += (batch.length / this.selectedImages.length) * 100;
        }

        // Refresh
        this.selectedImages = [];
        this.images = await this._endpoint.find("photo-movement", encodeURIComponent(this.directoryPath));
        this.images.forEach(i => i.canMove = !i.fileExists && !i.hasDuplicate);

        controller.cancel();
    }
}