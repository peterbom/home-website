export class ImageService {
    constructor(endpoint) {
        this._endpoint = endpoint;
    }

    async getPublicUris() {
        return await this._endpoint.find("public-uris");
    }

    async getDuplicateSets() {
        return await this._endpoint.find("duplicate-sets");
    }

    async getStatistics() {
        // {totalCount, readableCount, requiringMovementCount}
    }

    async getYearlyTotals() {
        // [{year: int, count: int}]
    }

    async getDailyTotals(fromDate, toDate) {
        // [n0, n1, ...]
    }

    async getImagesBetween(fromDateTime, toDateTime) {
        // [Image0, Image1, ...]
    }

    async getImages(ids) {
        // [Image0, Image1, ...]
    }

    async saveChanges(image) {
        let change = image.getChange();
        if (change.isChanged) {
            await this._endpoint.post(`image-update/${image.name}`, change);
            image.commitChange();
        }
    }

    async setImageOrdering(orderedImageNames) {
        if (orderedImageNames.length > 1) {
            await this._endpoint.post("image-ordering", {orderedImageNames: orderedImageNames});
        }
    }

    async delete(imageName) {
        await this._endpoint.destroy(`images/${imageName}`);
    }
}