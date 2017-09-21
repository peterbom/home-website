import {ImageChange} from "./image-change";

export class Image {
    constructor(imageInfo) {
        let getTakenDateTime = () => imageInfo.takenDateTime && new Date(imageInfo.takenDateTime) || null;
        let getTags = () => (imageInfo.tags || []).slice().sort();
        let getPosition = () => imageInfo.latitude && imageInfo.longitude ? {
            latitude: imageInfo.latitude,
            longitude: imageInfo.longitude,
            altitude: imageInfo.altitude
        } : null;

        this._originalValues = {
            takenDateTime: getTakenDateTime(),
            tags: getTags(),
            position: getPosition(),
            imageNumber: imageInfo.imageNumber,
            owner: imageInfo.owner
        };

        this.name = imageInfo.name;
        this.takenDateTime = getTakenDateTime();
        this.tags = getTags();
        this.position = getPosition();
        this.imageNumber = imageInfo.imageNumber;
        this.resizedWidths = (imageInfo.resizedWidths || []).slice();
        this.owner = imageInfo.owner;
    }

    getChange() {
        let change = new ImageChange();

        let isTakenTimeSet = this.takenDateTime && !this._originalValues.takenDateTime;
        let isTakenTimeUpdated =
            this.takenDateTime && this._originalValues.takenDateTime &&
            this.takenDateTime.getTime() !== this._originalValues.takenDateTime.getTime();
        if (isTakenTimeSet || isTakenTimeUpdated) {
            change.takenDateTime = this.takenDateTime;
        }

        let newTagLookup = {};
        (this.tags || []).forEach(tag => newTagLookup[tag] = true);

        let oldTagLookup = {};
        (this._originalValues.tags || []).forEach(tag => oldTagLookup[tag] = true);

        for (let newTag in newTagLookup) {
            if (!oldTagLookup[newTag]) {
                change.addedTags.push(newTag);
            }
        }

        for (let oldTag in oldTagLookup) {
            if (!newTagLookup[oldTag]) {
                change.removedTags.push(oldTag);
            }
        }

        let isPositionSet = this.position && !this._originalValues.position;
        let isPositionUpdated =
            this.position && this._originalValues.position &&
            (
                this.position.latitude !== this._originalValues.position.latitude ||
                this.position.longitude !== this._originalValues.position.longitude ||
                this.position.altitude !== this._originalValues.position.altitude
            );

        if (isPositionSet || isPositionUpdated) {
            change.position = Object.assign({}, this.position);
        }

        let isOwnerSet = this.owner && !this._originalValues.owner;
        let isOwnerUpdated = this.owner && this._originalValues.owner && this.owner !== this._originalValues.owner;
        if (isOwnerSet || isOwnerUpdated) {
            change.owner = this.owner;
        }

        return change;
    }

    commitChange() {
        this._originalValues.takenDateTime = this.takenDateTime;
        this._originalValues.tags = this.tags.slice();
        this._originalValues.position = this.position && Object.assign({}, this.position || null);
        this._originalValues.imageNumber = this.imageNumber;
        this._originalValues.owner = this.owner;
    }
}