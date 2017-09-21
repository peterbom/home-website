export class ImageService {
    constructor(endpoint) {
        this._endpoint = endpoint;
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
            await this._endpoint.post("commands/update-image", change);
            image.commitChange();
        }
    }
}