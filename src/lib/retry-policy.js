export class RetryPolicy {
    constructor(retryCount, initialInterval, maxInterval) {
        this._retryCount = retryCount;
        this._initialInterval = initialInterval;
        this._maxInterval = maxInterval;
    }

    async run(func) {
        let success = false;
        let attemptCount = 0;
        let result;
        do {
            attemptCount++;
            try {
                result = await func();
                success = true;
            } catch (exception) {
                if (attemptCount < this._retryCount) {
                    await delay(this._getRetryInterval(attemptCount));
                } else {
                    throw exception;
                }
            }
        } while (!success);

        return result;
    }

    _getRetryInterval(attemptCount) {
        let multiplier = Math.pow(2, attemptCount) - 1;
        let randomizer = 0.8 + Math.random() * 0.4; // Random number between 0.8 and 1.2
        let interval = this._initialInterval * multiplier * randomizer;
        return Math.min(interval, this._maxInterval);
    }
}

async function delay(ms) {
    await new Promise((resolve, reject) => {
        setTimeout(resolve, ms);
    });
}