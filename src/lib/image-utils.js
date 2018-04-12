export class ImageUtils {
    static isVideo(mimeType) {
        return /^video\/.+$/i.test(mimeType);
    }
}