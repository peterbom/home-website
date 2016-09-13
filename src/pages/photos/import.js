import {inject, NewInstance} from "aurelia-framework";
import {Endpoint} from "aurelia-api";
import {DialogService} from "aurelia-dialog";

@inject(Endpoint.of("main"), DialogService)
export class Import {

    selectedFiles;

    constructor (endpoint, dialogService) {
        this._endpoint = endpoint;
        this._dialogService = dialogService;
    }

    async activate (params) {
    }

    async import() {
        if (!this.selectedFiles || this.selectedFiles.length === 0) {
            return;
        }

        let batch = [];
        let batches = [batch];
        for (let i = 0; i < this.selectedFiles.length; i++) {
            batch.push(this.selectedFiles.item(i));
            if (batch.length === 10) {
                batch = [];
                batches.push(batch);
            }
        }

        let controller = await this._dialogService.openAndYieldController({
            viewModel: this.loadingModal,
            model: {
                message: "Importing",
                progressPercent: 0
            }});

        let upload = await this._endpoint.post("photo-upload");

        let uploadResource = `photo-upload/${upload._id}`;

        for (let batch of batches) {
            let uploadImage = async file => {
                await this._endpoint.update(uploadResource, file.name, file, {
                    headers: {
                        "Content-Type": null // 'application/octet-stream'
                    }
                });

                controller.viewModel.progressPercent += (1 / this.selectedFiles.length) * 100;
            };

            await Promise.all(batch.map(uploadImage));
        }

        this.selectedFiles = [];

        controller.cancel();
    }
}