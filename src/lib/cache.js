export class Cache {
    constructor(retriever, maxAgeInSeconds = 300) {
        this._retriever = retriever;
        this._maxAgeInMs = maxAgeInSeconds * 1000;
        this._result = null;
        this._expires = null;
    }

    invalidate() {
        this._result = null;
        this._expires = null;
    }

    async getResult() {
        if (this._result !== null &&
            this._expires !== null &&
            this._expires > Date.now()) {
            return this._result;
        }

        this._result = await this._retriever();
        this._expires = Date.now() + this._maxAgeInMs;

        return this._result;
    }
}