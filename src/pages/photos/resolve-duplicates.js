import {inject, NewInstance} from "aurelia-framework";
import {Endpoint} from "aurelia-api";
import {DialogService} from "aurelia-dialog";
import {LoadingModal} from "../../components/loading-modal";
import Sortable from "sortable";

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
        this.duplicateImages = await this._endpoint.find("photo-duplicate", this.hash);

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
            viewModel: LoadingModal,
            model: "Resolving Duplicates"});

        let sameIds = this.duplicateImages.map(i => i.id);
        let differentIds = this.distinctImages.map(i => i.id);
        let directories = await this._endpoint.post("photo-duplicate", {
            sameIds: sameIds,
            differentIds: differentIds
        });

        if (differentIds.length) {
            controller.viewModel.message = "Re-indexing";
            await this._endpoint.post("photo-index", {
                imageIds: differentIds,
                operation: "index"
            });
        }

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

        controller.viewModel.message = "Refreshing";
        this.duplicateImages = await this._endpoint.find("photo-duplicate", this.hash);
        this.distinctImages = [];
        this.deleteImages = [];

        controller.cancel();
    }
}