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

    imageSelector; // From view-model.ref attribute

    selectedFiles;

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

    async addImagesFromSelector() {
        this.selectedFiles = this.imageSelector.selectedFiles;

        this.pageSet = this._pageManager.getPageSet(this.selectedFiles);
        this.pageLinkGenerator = this._pageManager.getPageLinkGenerator(this.pageSet, 10);
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
            let progressPercent = (completeSize / totalFileSize) * 100;
            controller.viewModel.progressPercent = progressPercent;
            controller.viewModel.message =
                `Uploading (${Math.round(progressPercent * 100) / 100}%): Completed/Unrecognized/Duplicates: ` +
                `${this.uploadResult.completed.length}/${this.uploadResult.unrecognized.length}/${this.uploadResult.skipped.length}`;
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

            this.uploadResult.updateLists();
        }
    }

    async _uploadImage(file, speedSummaries, blobName) {
        if (!isKnownFilename(file.name)) {
            this.uploadResult.unrecognized.push(file.name);
            speedSummaries.push({ completeSize: file.size });
            return;
        }

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

const knownFilenameLookup = new Set([
    "avi", "bmp", "gif", "jpg", "jpeg", "mov", "mpg", "mpeg", "mp4", "ogv", "png", "qt", "thm", "tif", "tiff", "webm", "webp", "3gp", "3g2"
]);

function isKnownFilename(filename) {
    // https://stackoverflow.com/a/12900504
    let extension = filename.slice((filename.lastIndexOf(".") - 1 >>> 0) + 2).toLowerCase();
    return knownFilenameLookup.has(extension);
}

class UploadResult {
    constructor() {
        this.completed = [];
        this.skipped = [];
        this.unrecognized = [];
        this.failed = [];
        this.completedList = "";
        this.skippedList = "";
        this.unrecognizedList = "";
        this.failedList = "";
    }

    clear() {
        this.completed = [];
        this.skipped = [];
        this.unrecognized = [];
        this.failed = [];
        this.completedList = "";
        this.skippedList = "";
        this.unrecognizedList = "";
        this.failedList = "";
    }

    updateLists() {
        this.completedList = this.completed.join("\n");
        this.skippedList = this.skipped.join("\n");
        this.unrecognizedList = this.unrecognized.join("\n");
        this.failedList = this.failed.join("\n");
    }
}
