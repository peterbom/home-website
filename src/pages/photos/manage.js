import {inject, NewInstance} from "aurelia-framework";
import {Endpoint} from "aurelia-api";

@inject(Endpoint.of("main"))
export class Manage {
    directories = null;
    selectedDirectories = [];

    isIndexing = false;

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
            this.selectedDirectories = this.directories.filter(d => d.hasUnknownFiles);
        };

        // Call but don't await the initialize function. The view should handle this.directories
        // being uninitialized.
        initialize();
    }

    async reindex () {
        this.isIndexing = true;
        try {
            let reindexDirectory = async directory => {
                directory.hasUnknownFiles = null;
                await this._endpoint.update("photo-directory", encodeURIComponent(directory.path));
                directory.hasUnknownFiles = false;
            };

            let promises = this.selectedDirectories.map(reindexDirectory);
            await Promise.all(promises);
        } finally {
            this.isIndexing = false;
        }
    }
}