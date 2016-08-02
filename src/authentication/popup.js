import {PLATFORM, DOM} from 'aurelia-pal';
import {parseQueryString} from 'aurelia-path';

export class Popup {
    constructor() {
        this.popupWindow = null;
        this.polling     = null;
        this.url         = '';
    }

    async open(url, windowName, options) {
        this.url = url;
        const optionsString = buildPopupWindowOptions(options || {});

        // In case we can't launch our popup immediately (e.g. because of a popup blocker)
        // retry 10 times after a second each time
        await new Promise((resolve, reject) => {
            let count = 0;
            let poller = PLATFORM.global.setInterval(() => {
                this.popupWindow = PLATFORM.global.open(url, windowName, optionsString);
                count++;

                if (this.popupWindow) {
                    PLATFORM.global.clearInterval(poller);
                    resolve();
                } else if (count >= 10) {
                    PLATFORM.global.clearInterval(poller);
                    reject(new Error("Could not open popup window"));
                }
            }, 1000);
        });

        return this;
    }

    pollPopup() {
        return new Promise((resolve, reject) => {
            this.polling = PLATFORM.global.setInterval(() => {
                let errorData;

                try {
                    if (this.popupWindow &&
                        this.popupWindow.location.hash &&
                        this.popupWindow.location.host ===  PLATFORM.global.document.location.host) {

                        let queryString = this.popupWindow.location.hash.substring(1);
                        const qs = parseQueryString(queryString);

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
