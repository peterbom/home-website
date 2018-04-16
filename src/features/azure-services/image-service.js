import { Cache } from "../../lib/cache";
import { RetryPolicy } from "../../lib/retry-policy";

export class ImageService {
    constructor(endpoint) {
        this._endpoint = endpoint;
        this._retryPolicy = new RetryPolicy(10, 3 * 1000, 2 * 60 * 1000);

        // {
        //   resizedImageContainerUri: "<uri>",
        //   videosForWebContainerUri: "<uri>"
        // }
        this._uriCache = new Cache(() => this._retryPolicy.run(() => endpoint.find("public-uris")));

        // {
        //   yearlyTotals: [{year: <year>, count: <count>}, ...],
        //   tags: [{name: "<name>", count: <count>}, ...],
        //   cameras: [{id: "<id>", make: "<make>", model: "<model>", count: <count>}, ...]
        // }
        this._summaryDataCache = new Cache(() => this._retryPolicy.run(() => endpoint.find("image-summary")));
    }

    async getResizedImageContainerUri() {
        let uris = await this._uriCache.getResult();
        return uris.resizedImageContainerUri;
    }

    async getVideosForWebContainerUri() {
        let uris = await this._uriCache.getResult();
        return uris.videosForWebContainerUri;
    }

    async getDuplicateSets() {
        return await this._retryPolicy.run(() =>
            this._endpoint.find("duplicate-sets"));
    }

    async isFileHashUsed(base64EncodedMd5Hash) {
        return await this._retryPolicy.run(() =>
            this._endpoint.find(`hash-usage/${urlEncodeBase64(base64EncodedMd5Hash)}`));
    }

    async getStatistics() {
        // {totalCount, readableCount, requiringMovementCount}
    }

    async getYearlyTotals() {
        // [{year: int, count: int}, ...]
        let summaryData = await this._summaryDataCache.getResult();
        return summaryData.yearlyTotals;
    }

    async getTags() {
        // [{name: "<name>", count: <count>}, ...]
        let summaryData = await this._summaryDataCache.getResult();
        return summaryData.tags;
    }

    async getCameras() {
        // [{id: "<id>", make: "<make>", model: "<model>", count: <count>}, ...]
        let summaryData = await this._summaryDataCache.getResult();
        return summaryData.cameras;
    }

    async getDailyTotals(fromDate, toDate) {
        // [n0, n1, ...]
    }

    async search(criteria) {
        // criteria: {
        //   fromUtc: "YYYY-MM-DDTHH:mm:ss",
        //   toUtc: "YYYY-MM-DDTHH:mm:ss",
        //   fromLocal: "YYYY-MM-DD",
        //   toLocal: "YYYY-MM-DD",
        //   ianaTimeZoneIds: ["Asia/Bangkok", "Europe/London", ...],
        //   locationWithin: {latitudeMin: y0, latitudeMax: y1, longitudeMin: x0, longitudeMax: x1},
        //   ownerIds: ["5a17ac7830cad649300e1cfe", ...],
        //   tags: ["computer", "landscape"],
        //   cameraIds: ["5a1d238327ad84bb2c7ca4e9", ...]
        // }
        //
        // result: [Image0, Image1, ...]
        return await this._retryPolicy.run(() =>
            this._endpoint.post("image-search", criteria));
    }

    async retrieve(names, includes) {
        // includes: {
        //   takenDateTime: true,
        //   owner: true,
        //   tags: true,
        //   position: true,
        //   sizes: true,
        //   fileInfo: true,
        //   exifData: true,
        //   videoData: true
        // }
        //
        // result: [
        //   {name, mimeType,
        //    takenUtc, takenLocal,
        //    ownerId, cameraId,
        //    tags,
        //    location, altitude,
        //    sizes,
        //    pixelCount, fileSizeBytes, fileMd5Hash, originalFilename,
        //    exifData,
        //    videoData}
        //]
        return await this._retryPolicy.run(() => 
            this._endpoint.post("image-retrieval", {
                names: names,
                includes: includes
            }));
    }

    async saveChanges(image) {
        let change = image.getChange();
        if (change.isChanged) {
            await this._retryPolicy.run(() =>
                this._endpoint.post(`image-update/${image.name}`, change));
            image.commitChange();
        }
    }

    async setImageOrdering(orderedImageNames) {
        if (orderedImageNames.length > 1) {
            await this._retryPolicy.run(() =>
                this._endpoint.post("image-ordering", {orderedImageNames: orderedImageNames}));
        }
    }

    async delete(imageName) {
        await this._retryPolicy.run(() =>
            this._endpoint.destroy(`images/${imageName}`));
    }
}

function urlEncodeBase64(base64String) {
    // https://tools.ietf.org/html/rfc4648#section-5
    // https://brockallen.com/2014/10/17/base64url-encoding
    // Remove trailing '='
    // Replace '+' with '-'
    // Replace '/' with '_'
    return base64String
        .replace(/=+$/, "")
        .replace(/\+/g, "-")
        .replace(/\//g, "_");
}