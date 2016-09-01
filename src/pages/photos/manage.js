import {inject, NewInstance} from "aurelia-framework";
import {Endpoint} from "aurelia-api";

@inject(Endpoint.of("main"))
export class Manage {
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
        return
            this.directories &&
            this.selectedDirectories &&
            this.selectedDirectories.length === this.directories.length;
    }

    constructor (endpoint) {
        this._endpoint = endpoint;
    }

    async activate () {
        let initialize = async () => {
            this.directories = await this._endpoint.find("photo-directory");
        };

        // Call but don't await the initialize function. The view should handle this.directories
        // being uninitialized.
        initialize();
    }

    async index () {
        this.isWorking = true;
        try {
            let callIndexDirectory = async directory => {
                await indexDirectory(this._endpoint, directory);
            };

            await Promise.all(this.selectedDirectories.map(callIndexDirectory));
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
                    await this._endpoint.update("photo-directory", encodeURIComponent(directory.directoryPath), {
                        operation: "clean"
                    });
                } finally {
                    directory.isCleaning = false;
                }
            };
        } finally {
            this.isWorking = false;
        }
    }

    async reindex () {
        this.isWorking = true;
        try {
            let reindexDirectory = async directory => {
                await this._endpoint.update("photo-directory", encodeURIComponent(directory.directoryPath), {
                    operation: "invalidate"
                });

                // All files are effectively new now the indexed files are invalidated.
                directory.newFileCount = directory.fileCount;

                await indexDirectory(this._endpoint, directory);
            };

            await Promise.all(this.selectedDirectories.map(reindexDirectory));
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
            let result = await endpoint.update("photo-directory", encodeURIComponent(directory.directoryPath), {
                operation: "index"
            });

            directory.newFileCount -= result.indexed;
            filesOutstanding = result.remaining > 0;
        } while (filesOutstanding)
    } finally {
        directory.isIndexing = false;
    }

    directory.newFileCount = 0;
}