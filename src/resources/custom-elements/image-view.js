import {bindable, computedFrom} from "aurelia-framework";

export class ImageView {
    @bindable image;
    @bindable imageUri;
    @bindable videoUri;

    @computedFrom('image.mimeType')
    get isVideo() {
        return /^video\/.+$/i.test(this.image.mimeType);
    }

    @computedFrom('isVideo')
    get thumbnailUrl() {
        return this.isVideo
            ? `${this.videoUri}/200/${this.image.name}`
            : `${this.imageUri}/200/${this.image.name}`;
    }
}
