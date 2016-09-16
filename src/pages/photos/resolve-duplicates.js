import {inject, NewInstance} from "aurelia-framework";
import {Endpoint} from "aurelia-api";
import {DialogService} from "aurelia-dialog";
import Sortable from "sortable";
import base64url from "base64-url";

@inject(Endpoint.of("main"), DialogService)
export class ResolveDuplicates {

    hash;

    duplicateImages = [];
    distinctImages = [];
    deleteImages = [];

    thumbnailLookup = {};

    constructor (endpoint, dialogService) {
        this._endpoint = endpoint;
        this._dialogService = dialogService;
    }

    async activate (params) {
        this.hash = params.id;
        await this.refreshDuplicates();

        let thumbnails = await this._endpoint.find("photo-exif-data", {
            json: JSON.stringify({
                imageHash: this.hash,
                thumbnailsOnly: true
            })
        });

        for (let imageId in thumbnails) {
            let imageString = thumbnails[imageId].ThumbnailImage;
            this.thumbnailLookup[imageId] = imageString ? imageString.substring("base64:".length) : null;
        }
    }

    async refreshDuplicates () {
        this.duplicateImages = await this._endpoint.find("photo-duplicate", this.hash);
        this.duplicateImages.forEach(i => i.pathParam = base64url.encode(i.directoryPath));
        this.distinctImages = [];
        this.deleteImages = [];
    }

    attached() {
        // See:
        // https://www.sitepoint.com/composition-aurelia-report-builder/
        // https://github.com/RubaXa/Sortable
        Sortable.create(this.duplicateList, {
            sort: false,
            group: {
                name: "arrange",
                pull: true,
                put: true
            },
            onAdd: evt => {
                let removeFromDistinctIndex = evt.oldIndex;
                let insertInDuplicateIndex = evt.newIndex;

                let image = this.distinctImages.splice(removeFromDistinctIndex, 1)[0];
                this.duplicateImages.splice(insertInDuplicateIndex, 0, image);
            }
        });

        Sortable.create(this.distinctList, {
            sort: true,
            group: {
                name: "arrange",
                pull: true,
                put: true
            },
            onAdd: evt => {
                let removeFromDuplicateIndex = evt.oldIndex;
                let insertInDistinctIndex = evt.newIndex;

                let image = this.duplicateImages.splice(removeFromDuplicateIndex, 1)[0];

                // We never delete images if they've been moved to the distinct list
                let deleteIndex = this.deleteImages.indexOf(image);
                if (deleteIndex >= 0) {
                    this.deleteImages.splice(deleteIndex, 1);
                }

                this.distinctImages.splice(insertInDistinctIndex, 0, image);
            }
        });
    }

    async save() {
        let controller = await this._dialogService.openAndYieldController({
            viewModel: this.loadingModal,
            model: {
                message: "Resolving Duplicates",
                progressPercent: 0
            }
        });

        let sameIds = this.duplicateImages.map(i => i.id);
        let differentIds = this.distinctImages.map(i => i.id);
        let directories = await this._endpoint.post("photo-duplicate", {
            sameIds: sameIds,
            differentIds: differentIds
        });

        controller.viewModel.progressPercent = 25;

        if (differentIds.length) {
            controller.viewModel.message = "Re-indexing";
            await this._endpoint.post("photo-index", {
                imageIds: differentIds,
                operation: "index"
            });
        }

        controller.viewModel.progressPercent = 50;

        if (this.deleteImages.length) {
            controller.viewModel.message = "Deleting files";

            let promises = this.deleteImages.map(i => this._endpoint.destroy("file", {
                directoryPath: i.directoryPath,
                filename: i.filename
            }));

            await Promise.all(promises);

            controller.viewModel.message = "Cleaning index";
            let imageIds = this.deleteImages.map(i => i.id);

            await this._endpoint.post("photo-index", {
                imageIds: imageIds,
                operation: "clean"
            })
        }

        controller.viewModel.progressPercent = 75;

        controller.viewModel.message = "Refreshing";
        await this.refreshDuplicates();

        controller.viewModel.progressPercent = 100;
        controller.cancel();
    }
}