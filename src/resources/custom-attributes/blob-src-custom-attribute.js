import {inject} from "aurelia-framework";

const EmptySrc = "#";

@inject(Element)
export class BlobSrcCustomAttribute {
    constructor (element) {
        this._element = element;
        this._element.onload = () => this.cleanup();
        this._unrevokedSrc = null;
    }

    valueChanged(blob) {
        this.cleanup();

        if (blob) {
            this._unrevokedSrc = this._element.src = URL.createObjectURL(blob);
        } else {
            this._element.src = EmptySrc;
        }
    }

    cleanup() {
        if (this._unrevokedSrc) {
            URL.revokeObjectURL(this._unrevokedSrc);
            this._unrevokedSrc = null;
        }
    }

    detached() {
        this.cleanup();
    }
}
