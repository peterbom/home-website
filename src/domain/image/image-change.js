export class ImageChange {
    constructor() {
        this.takenDateTime = null;
        this.addedTags = [];
        this.removedTags = [];
        this.position = null;
        this.owner = null;
    }

    isChanged() {
        return this.takenDateTime || this.addedTags.length || this.removedTags.length || this.position;
    }
}