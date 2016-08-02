import {PLATFORM, DOM} from 'aurelia-pal';
import {parseQueryString} from 'aurelia-path';

export class Popup {
    constructor() {
        this.popupWindow = null;
        this.polling     = null;
        this.url         = '';
    }

    open(url, windowName, options) {
        this.url = url;
        const optionsString = buildPopupWindowOptions(options || {});

        this.popupWindow = PLATFORM.global.open(url, windowName, optionsString);

        if (this.popupWindow && this.popupWindow.focus) {
            this.popupWindow.focus();
        }

        return this;
    }

    pollPopup() {
        return new Promise((resolve, reject) => {
            this.polling = PLATFORM.global.setInterval(() => {
                let errorData;

                try {
                    if (this.popupWindow.location.host ===  PLATFORM.global.document.location.host
                        && (this.popupWindow.location.search || this.popupWindow.location.hash)) {
                        const qs = parseUrl(this.popupWindow.location);

                        if (qs.error) {
                            reject({error: qs.error});
                        } else {
                            resolve(qs);
                        }

                        this.popupWindow.close();
                        PLATFORM.global.clearInterval(this.polling);
                    }
                } catch (error) {
                    errorData = error;
                }

                if (!this.popupWindow) {
                    PLATFORM.global.clearInterval(this.polling);
                    reject({
                        error: errorData,
                        data: 'Provider Popup Blocked'
                    });
                } else if (this.popupWindow.closed) {
                    PLATFORM.global.clearInterval(this.polling);
                    reject({
                        error: errorData,
                        data: 'Problem poll popup'
                    });
                }
            }, 35);
        });
    }
}

const buildPopupWindowOptions = options => {
    const width  = options.width || 500;
    const height = options.height || 500;

    const extended = Object.assign({
        width: width,
        height: height,
        left: PLATFORM.global.screenX + ((PLATFORM.global.outerWidth - width) / 2),
        top: PLATFORM.global.screenY + ((PLATFORM.global.outerHeight - height) / 2.5)
    }, options);

    let parts = [];
    Object.keys(extended).map(key => parts.push(key + '=' + extended[key]));

    return parts.join(',');
};

const parseUrl = url => {
    return Object.assign({}, parseQueryString(url.search), parseQueryString(url.hash));
};
