import {PLATFORM} from 'aurelia-pal';

export class Storage {
    get(key) {
        return PLATFORM.global['localStorage'].getItem(key);
    }

    set(key, value) {
        PLATFORM.global['localStorage'].setItem(key, value);
    }

    remove(key) {
        PLATFORM.global['localStorage'].removeItem(key);
    }
}
