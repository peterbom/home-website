import {inject, NewInstance} from "aurelia-framework";
import {Endpoint} from "aurelia-api";
import {DialogService} from "aurelia-dialog";

@inject(Endpoint.of("main"), DialogService)
export class Unreadable {

    images;

    selectedImages = [];

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

    constructor (endpoint, dialogService) {
        this._endpoint = endpoint;
        this._dialogService = dialogService;
    }

    async activate (params) {
        this.images = await this._endpoint.find("photo-image", {
            json: JSON.stringify({
                unreadable: true
            })
        });
    }

    async delete () {
        if (this.selectedImages.length === 0) {
            return;
        }

        let controller = await this._dialogService.openAndYieldController({
            viewModel: this.loadingModal,
            model: {
                message: "Deleting files",
                progressPercent: 0
            }});

        let deleteFile = async image => {
            await this._endpoint.destroy("file", {
                directoryPath: image.directoryPath,
                filename: image.filename
            });

            await this._endpoint.post("photo-index", {
                imageIds: [image.id],
                operation: "clean"
            });

            controller.viewModel.progressPercent += (1 / this.selectedImages.length) * 100;
        };

        await Promise.all(this.selectedImages.map(deleteFile));

        // Refresh
        this.images = await this._endpoint.find("photo-image", {
            json: JSON.stringify({
                unreadable: true
            })
        });

        this.selectedImages = [];

        controller.cancel();
    }
}