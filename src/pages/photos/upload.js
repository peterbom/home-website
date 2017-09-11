import {inject, NewInstance} from "aurelia-framework";
import {Router} from "aurelia-router";
import {Endpoint} from "aurelia-api";
import {DialogService} from "aurelia-dialog";
import base64url from "base64-url";
import moment from "moment";

@inject(Router, Endpoint.of("main"), DialogService, "page-manager", "authentication-manager")
export class Import {

    owner;

    fileInputElem; // From ref attribute

    fileList;  // bound to file selector
    selectedFiles = [];

    pageSet;
    pageLinkGenerator;

    constructor (router, endpoint, dialogService, pageManager, authenticationManager) {
        this._router = router;
        this._endpoint = endpoint;
        this._dialogService = dialogService;
        this._pageManager = pageManager;
        this._auth = authenticationManager;
    }

    activate() {
        this.owner = this._auth.profile && (this._auth.profile.name || this._auth.profile.email);
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

        let totalFileSize = this.selectedFiles.reduce((size, f) => size + f.size, 0);

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

        let blobService, blobContainerName;
        let queueService, queueName;
        let messageEncoder = new AzureStorage.QueueMessageEncoder.TextBase64QueueMessageEncoder();
        if (window.env.NODE_ENV === "development") {
            // Save bandwidth by using a local storage emulator.
            // https://docs.microsoft.com/en-us/azure/storage/common/storage-use-emulator
            let storageEmulatorConnectionString = "UseDevelopmentStorage=true";
            blobService = AzureStorage.createBlobService(storageEmulatorConnectionString);
            queueService = AzureStorage.createQueueService(storageEmulatorConnectionString);
            blobContainerName = "images";
            queueName = "client-requests";
        } else {
            // For non-development environments, use an SAS token provided by the API to authenticate with storage.
            let azureSasTokenResponse = await this._endpoint.find("azure-sas-token");
            let blobTokenInfo = azureSasTokenResponse.blob;
            let queueTokenInfo = azureSasTokenResponse.queue;
            blobService = AzureStorage.createBlobServiceWithSas(blobTokenInfo.host, blobTokenInfo.token);
            queueService = AzureStorage.createQueueServiceWithSas(queueTokenInfo.host, queueTokenInfo.token);
            blobContainerName = blobTokenInfo.container;
            queueName = queueTokenInfo.queue;
        }

        let dateString = moment().format("YYYY-MM-DD_HH-mm-ss");
        let imageIndex = 1;
        let speedSummaries = [];

        // An interval for refreshing progress
        let intervalId = setInterval(() => {
            let completeSize = speedSummaries.reduce((total, ss) => total + ss.completeSize, 0);
            controller.viewModel.progressPercent = (completeSize / totalFileSize) * 100;
        }, 200);

        // The function used to upload each individual file
        let uploadImage = async file => {
            let blobName = `${dateString}_${("00000" + imageIndex++).slice(-5)}`;
            let customBlockSize = file.size > 1024 * 1024 * 32 // 32 MB
                ? 1024 * 1024 * 4   // 4 MB
                : 1024 * 512;       // 512 kB
            blobService.singleBlobPutThresholdInBytes = customBlockSize;

            let options = {
                blockSize : customBlockSize,
                metadata: {
                    owner: this.owner,
                    filename: file.name
                }
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
                    blobContainerName,
                    blobName,
                    file,
                    options,
                    callback);

                speedSummaries.push(speedSummary);
            });

            let message = {
                task: "RegisterNewImage",
                name: blobName
            };

            let encodedMessage = messageEncoder.encode(JSON.stringify(message));
            await new Promise((resolve, reject) => {
                queueService.createMessage(queueName, encodedMessage, error => error ? reject(error) : resolve());
            });
        };

        for (let batch of batches) {
            await Promise.all(batch.map(uploadImage));
        }

        clearInterval(intervalId);

        controller.viewModel.progressPercent = 100;
        controller.cancel();

        this.clear();
    }
}
