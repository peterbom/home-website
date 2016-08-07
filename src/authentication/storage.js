import {PLATFORM} from "aurelia-pal";

export class Storage {
	constructor() {
		this._storage = PLATFORM.global["localStorage"];
	}

    get(key) {
        return this._storage.getItem(key);
    }

    set(key, value) {
        this._storage.setItem(key, value);
    }

    remove(key) {
        this._storage.removeItem(key);
    }
}
