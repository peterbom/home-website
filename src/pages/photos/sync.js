import {inject, NewInstance} from "aurelia-framework";
import {Endpoint} from "aurelia-api";
import {DialogService} from "aurelia-dialog";
import base64url from "base64-url";

@inject(Endpoint.of("main"), DialogService)
export class Sync {
    directories = null;
    selectedDirectories = [];

    isWorking = false;

    set allSelected (val) {
        if (val) {
            this.selectedDirectories = (this.directories || []).slice();
        } else {
            this.selectedDirectories = [];
        }
    }

    get allSelected () {
        return this.directories &&
            this.selectedDirectories &&
            this.selectedDirectories.length === this.directories.length;
    }

    constructor (endpoint, dialogService) {
        this._endpoint = endpoint;
        this._dialogService = dialogService;
    }

    async activate () {
        let directoryPaths = await this._endpoint.find("photo-index");
        this.directories = directoryPaths.map(p => ({
            directoryPath: p,
            pathParam: base64url.encode(p)
        }));

        let initialize = async () => {
            let controller = await this._dialogService.openAndYieldController({
                viewModel: this.loadingModal,
                model: {
                    message: "Comparing directories",
                    progressPercent: 0
                }
            });

            let updateDirectory = async directory => {
                let diff = await this._endpoint.find("photo-index", encodeURIComponent(directory.directoryPath));

                directory.fileCount = diff.fileCount;
                directory.newFileCount = diff.newFileCount;
                directory.deletedFileCount = diff.deletedFileCount;

                controller.viewModel.progressPercent += (1 / this.directories.length) * 100;
            };

            await Promise.all(this.directories.map(updateDirectory));

            // By default, select those directories which have new files
            this.selectedDirectories = this.directories.filter(d => d.newFileCount > 0);

            controller.cancel();
        };

        // Call but don't await the initialize function. The view should handle this.directories
        // being uninitialized.
        window.setTimeout(initialize, 100);
    }

    async index () {
        this.isWorking = true;
        try {
            // Index serially, not in parallel, as it's quite CPU intensive
            for (let directory of this.selectedDirectories) {
                await indexDirectory(this._endpoint, directory);
            }
        } finally {
            this.isWorking = false;
        }
    }

    async clean () {
        this.isWorking = true;
        try {
            let cleanDirectory = async directory => {
                directory.isCleaning = true;
                try {
                    await this._endpoint.post("photo-index", {
                        directoryPath: directory.directoryPath,
                        operation: "clean"
                    });
                } finally {
                    directory.isCleaning = false;
                }
            };

            await Promise.all(this.selectedDirectories.map(cleanDirectory));
        } finally {
            this.isWorking = false;
        }
    }

    async reindex () {
        this.isWorking = true;
        try {
            // Index serially, not in parallel, as it's quite CPU intensive
            for (let directory of this.selectedDirectories) {
                await this._endpoint.post("photo-index", {
                    directoryPath: directory.directoryPath,
                    operation: "invalidate"
                });

                // All files are effectively new now the indexed files are invalidated.
                directory.newFileCount = directory.fileCount;

                await indexDirectory(this._endpoint, directory);
            }
        } finally {
            this.isWorking = false;
        }
    }
}

async function indexDirectory (endpoint, directory) {
    let filesOutstanding = false;
    directory.isIndexing = true;
    try {
        do {
            let result = await endpoint.post("photo-index", {
                directoryPath: directory.directoryPath,
                operation: "index"
            });

            directory.newFileCount = result.remaining;
            filesOutstanding = result.remaining > 0;
        } while (filesOutstanding)
    } finally {
        directory.isIndexing = false;
    }

    directory.newFileCount = 0;
}