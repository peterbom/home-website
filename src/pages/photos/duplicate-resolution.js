import {inject, NewInstance} from "aurelia-framework";
import {Endpoint} from "aurelia-api";

@inject("image-service")
export class DuplicateResolution {

    constructor (imageService) {
        this._imageService = imageService;
        
        this.duplicateSets = [];
        this.resizedImageContainerUri = null;
    }

    async activate (params) {
        this.resizedImageContainerUri = await this._imageService.getResizedImageContainerUri();

        this.duplicateSets = await this._imageService.getDuplicateSets();
        for (let set of this.duplicateSets) {
            set.imagesToDelete = [];

            for (let image of set.images) {
                image.thumbnailUrl = image.sizes && image.sizes["200"] ? `${this.resizedImageContainerUri}/200/${image.name}` : null;
                image.takenDateTimeString = image.takenDateTime ? new Date(image.takenDateTime).toLocaleString() : "";
                image.tagListString = Object
                    .keys(image.tags || {})
                    .filter(t => image.tags[t])
                    .join(", ");

                image.backgroundColor = getColor(image.fileMd5Hash);
            }
        }
    }

    moveUp(set, index) {
        // Swap the item at index 'index' with the item at index 'index - 1'
        set.images.splice(index - 1, 2, set.images[index], set.images[index - 1]);
    }

    async save(set) {
        let imageNamesToDelete = set.imagesToDelete.map(i => i.name);
        let orderedImageNames = set.images
            .map(i => i.name)
            .filter(name => imageNamesToDelete.indexOf(name) < 0);
        
        // Submit changes
        let deletePromises = imageNamesToDelete.map(name => this._imageService.delete(name));
        await Promise.all(deletePromises);
        await this._imageService.setImageOrdering(orderedImageNames);

        // Remove this set from the results
        this.duplicateSets.splice(this.duplicateSets.indexOf(set), 1);
    }
}

function getColor(hash) {
    // Hue is a value between 0 and 360.
    // Sum the character codes of each character in the hash and take the modulus to get a value between 0 and 360.
    let hue = Array.from(hash).map(c => c.charCodeAt()).reduce((a, b) => a + b, 0) % 360;

    // https://github.com/bgrins/TinyColor
    return tinycolor(`hsl(${hue}, 100%, 90%)`).toRgbString();
}