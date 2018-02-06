import {inject, NewInstance, computedFrom} from "aurelia-framework";
import {Router} from "aurelia-router";
import {Endpoint} from "aurelia-api";
import {DialogService} from "aurelia-dialog";
import base64url from "base64-url";
import moment from "moment";
import {FileUtils} from "../../lib/file-utils";

@inject(Router, "blob-service", "image-service", DialogService, "page-manager", "authentication-manager")
export class Import {

    owner;

    fileInputElem; // From ref attribute

    fileList;  // bound to file selector
    selectedFiles = [];

    pageSet;
    pageLinkGenerator;

    constructor (router, blobService, imageService, dialogService, pageManager, authenticationManager) {
        this._router = router;
        this._blobService = blobService;
        this._imageService = imageService;
        this._dialogService = dialogService;
        this._pageManager = pageManager;
        this._auth = authenticationManager;
    }

    activate() {
        this.owner = this._auth.profile && (this._auth.profile.name || this._auth.profile.email);
        this.uploadResult = new UploadResult();
        this.displayUploadResult = false;
    }

    async handleFileListChanged() {
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
        this.displayUploadResult = false;
    }

    clear() {
        this.pageSet = this._pageManager.getPageSet([]);
        this.pageLinkGenerator = this._pageManager.getPageLinkGenerator(this.pageSet, 10);
    }

    async upload() {
        if (!this.selectedFiles || this.selectedFiles.length === 0) {
            return;
        }

        this.uploadResult.clear();
        this.displayUploadResult = true;
        let fileCount = this.selectedFiles.length;
        let totalFileSize = this.selectedFiles.reduce((size, f) => size + f.size, 0);

        // Avoid uploading several images in parallel, since it doesn't appear to
        // improve performance, and it's better if a network error during a batch
        // only stops a single upload rather than several.
        let files = this.selectedFiles.slice();
        this.selectedFiles.length = 0;

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

        try {
            console.info(`Processing ${fileCount} files`);
            for (let file of files) {
                let blobName = `${dateString}_${("00000" + imageIndex++).slice(-5)}`;
                await this._uploadImage(file, speedSummaries, blobName);
            }

            this.clear();
            console.info("Upload completed successfully");
        } finally {
            clearInterval(intervalId);

            controller.viewModel.progressPercent = 100;
            controller.cancel();
        }
    }

    async _uploadImage(file, speedSummaries, blobName) {
        let hashString = await FileUtils.getMd5Hash(file);
        let isUsed = await this._imageService.isFileHashUsed(hashString);
        if (isUsed) {
            this.uploadResult.skipped.push(file.name);
            speedSummaries.push({ completeSize: file.size });
            return;
        }

        try {
            await this._blobService.uploadBlob(file, blobName, this.owner, ss => speedSummaries.push(ss));
            this.uploadResult.completed.push(file.name);
    
            console.info(`Completed uploading ${file.name} to blob ${blobName}`);
        } catch (e) {
            this.uploadResult.failed.push(file.name);
            throw e;
        }
    }
}

class UploadResult {
    constructor() {
        this.completed = [];
        this.skipped = [];
        this.failed = [];
    }

    clear() {
        this.completed.length = 0;
        this.skipped.length = 0;
        this.failed.length = 0;
    }

    @computedFrom("completed.length")
    get completedList() {
        return this.completed.join("\n");
    }

    @computedFrom("skipped.length")
    get skippedList() {
        return this.skipped.join("\n");
    }

    @computedFrom("failed.length")
    get failedList() {
        return this.failed.join("\n");
    }
}
