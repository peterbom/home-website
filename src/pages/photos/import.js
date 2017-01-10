import {inject, NewInstance} from "aurelia-framework";
import {Router} from "aurelia-router";
import {Endpoint} from "aurelia-api";
import {DialogService} from "aurelia-dialog";
import base64url from "base64-url";

@inject(Router, Endpoint.of("main"), DialogService)
export class Import {

    fileInputElem; // From ref attribute

    fileList;  // bound to file selector
    selectedFiles = [];

    constructor (router, endpoint, dialogService) {
        this._router = router;
        this._endpoint = endpoint;
        this._dialogService = dialogService;
    }

    handleFileListChanged() {
        this.selectedFiles = [];
        for (let i = 0; i < this.fileList.length; i++) {
            this.selectedFiles.push(this.fileList.item(i));
        }

        // Release the file objects held by the file input element
        // http://stackoverflow.com/a/35323290
        this.fileList = null;
        this.fileInputElem.type = "";
        this.fileInputElem.type = "file";
    }

    async import() {
        if (!this.selectedFiles || this.selectedFiles.length === 0) {
            return;
        }

        let batches = [];
        while (this.selectedFiles.length > 0) {
            batches.push(this.selectedFiles.splice(0, 10));
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

                controller.viewModel.progressPercent += (1 / this.selectedFiles.length) * 50;
            };

            await Promise.all(batch.map(uploadImage));
        }

        controller.viewModel.message = "Indexing";
        let filesOutstanding = false;
        do {
            let result = await this._endpoint.post("photo-index", {
                directoryPath: upload.directoryPath,
                operation: "index"
            });

            controller.viewModel.progressPercent += (result.indexed / this.selectedFiles.length) * 50;
            filesOutstanding = result.remaining > 0;
        } while (filesOutstanding)

        controller.viewModel.progressPercent = 100;
        controller.cancel();

        this._router.navigateToRoute("search", {path: base64url.encode(upload.directoryPath)}, {replace: true});
    }
}
