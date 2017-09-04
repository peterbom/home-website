import {inject, NewInstance} from "aurelia-framework";
import {Router} from "aurelia-router";
import {Endpoint} from "aurelia-api";
import {DialogService} from "aurelia-dialog";
import base64url from "base64-url";
import moment from "moment";

@inject(Router, Endpoint.of("main"), DialogService, "page-manager")
export class Import {

    fileInputElem; // From ref attribute

    fileList;  // bound to file selector
    selectedFiles = [];

    pageSet;
    pageLinkGenerator;

    constructor (router, endpoint, dialogService, pageManager) {
        this._router = router;
        this._endpoint = endpoint;
        this._dialogService = dialogService;
        this._pageManager = pageManager;
    }

    handleFileListChanged() {
        this.selectedFiles = [];
        for (let i = 0; i < this.fileList.length; i++) {
            this.selectedFiles.push(this.fileList.item(i));
        }

        this.pageSet = this._pageManager.getPageSet(this.selectedFiles);
        this.pageLinkGenerator = this._pageManager.getPageLinkGenerator(this.pageSet, 10);

        // Release the file objects held by the file input element
        // http://stackoverflow.com/a/35323290
        this.fileList = null;
        this.fileInputElem.type = "";
        this.fileInputElem.type = "file";
    }

    clear() {
        this.pageSet = this._pageManager.getPageSet([]);
        this.pageLinkGenerator = this._pageManager.getPageLinkGenerator(this.pageSet, 10);
    }

    async upload() {
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
                message: "Uploading",
                progressPercent: 0
            }});

        let azureSasTokenResponse = await this._endpoint.find("azure-sas-token");
        let blobService = AzureStorage.createBlobServiceWithSas(
            azureSasTokenResponse.host,
            azureSasTokenResponse.token);

        let dateString = moment().format("YYYY-MM-DD_HH-mm-ss");
        let imageIndex = 1;
        let speedSummaries = [];

        let timer = setTimeout(() => {
            let totalFilesPercent = this.selectedFiles.length * 100;
            let currentPercent = speedSummaries.reduce((total, ss) => total + ss.getCompletePercent(), 0);
            controller.viewModel.progressPercent = (currentPercent / totalFilesPercent) * 100;
        }, 200);

        for (let batch of batches) {
            let uploadImage = async file => {
                let blobName = `${dateString}_${("00000" + imageIndex++).slice(-5)}`;
                let customBlockSize = file.size > 1024 * 1024 * 32 // 32 MB
                    ? 1024 * 1024 * 4   // 4 MB
                    : 1024 * 512;       // 512 kB
                blobService.singleBlobPutThresholdInBytes = customBlockSize;

                let options = {
                    blockSize : customBlockSize
                };

                await new Promise((resolve, reject) => {
                    let callback = error => {
                        if (error) {
                            reject(error);
                        } else {
                            resolve();
                        }
                    };

                    let speedSummary = blobService.createBlockBlobFromBrowserFile(
                        "images",
                        blobName,
                        file,
                        options,
                        callback);

                    speedSummaries.push(speedSummary);
                });
            };

            await Promise.all(batch.map(uploadImage));
        }

        clearTimeout(timer);

        controller.viewModel.progressPercent = 100;
        controller.cancel();

        this.clear();
    }
}
