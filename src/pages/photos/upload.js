import {inject, NewInstance} from "aurelia-framework";
import {Router} from "aurelia-router";
import {Endpoint} from "aurelia-api";
import {DialogService} from "aurelia-dialog";
import base64url from "base64-url";
import moment from "moment";

@inject(Router, "blob-service", DialogService, "page-manager", "authentication-manager")
export class Import {

    owner;

    fileInputElem; // From ref attribute

    fileList;  // bound to file selector
    selectedFiles = [];

    pageSet;
    pageLinkGenerator;

    constructor (router, blobService, dialogService, pageManager, authenticationManager) {
        this._router = router;
        this._blobService = blobService;
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

        let fileCount = this.selectedFiles.length;
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
            await this._blobService.uploadBlob(file, blobName, this.owner, ss => speedSummaries.push(ss));

            console.info(`Completed uploading ${file.name} to blob ${blobName}`);
        };

        try {
            console.info(`Processing ${fileCount} files`);
            for (let batch of batches) {
                await Promise.all(batch.map(uploadImage));
            }

            this.clear();
            console.info("Upload completed successfully");
        } finally {
            clearInterval(intervalId);

            controller.viewModel.progressPercent = 100;
            controller.cancel();
        }
    }
}
