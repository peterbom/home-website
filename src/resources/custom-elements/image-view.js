import {bindable, computedFrom} from "aurelia-framework";
import { ImageUtils } from "../../lib/image-utils";

export class ImageView {
    @bindable image;
    @bindable imageUri;
    @bindable videoUri;

    @computedFrom('image.mimeType')
    get isVideo() {
        return ImageUtils.isVideo(this.image.mimeType);
    }

    @computedFrom('isVideo')
    get thumbnailUrl() {
        return this.isVideo
            ? `${this.videoUri}/${this.image.name}`
            : `${this.imageUri}/200/${this.image.name}`;
    }
}
