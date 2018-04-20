import { RetryPolicy } from "../../lib/retry-policy";

export class BlobService {
    constructor(imageService) {
        this._imageService = imageService;

        this._blobConnection = {
            service: null,
            containerName: null,
            renewAt: null
        };

        // https://azure.github.io/azure-storage-node/ExponentialRetryPolicyFilter.html
        let retryCount = 10;
        let retryInterval = 5 * 1000; // 5s, 10s, 20s, 40s, ...
        let minRetryInterval = 4 * 1000;
        let maxRetryInterval = 10 * 60 * 1000; // 10 min
        this._retryFilter = new AzureStorage.ExponentialRetryPolicyFilter(
            retryCount, retryInterval, minRetryInterval, maxRetryInterval);

        // Retry policy for entire upload operations, including recreating
        // the blob service.
        this._retryPolicy = new RetryPolicy(3, 10 * 1000, 2 * 60 * 1000);
    }

    async _ensureService(forceReconnect) {
        if (!forceReconnect && this._blobConnection && this._blobConnection.service && this._blobConnection.renewAt > new Date()) {
            return;
        }

        let blobTokenInfo = await this._imageService.getBlobContainerToken();
        this._blobConnection.service = AzureStorage
            .createBlobServiceWithSas(blobTokenInfo.host, blobTokenInfo.token)
            .withFilter(this._retryFilter);

        this._blobConnection.containerName = blobTokenInfo.container;
        
        // Make sure this service is renewed (with another token) if it's less than 120 minutes away from expiry
        // (to allow for 2-hour blob uploads).
        let renewAt = new Date(blobTokenInfo.expiry);
        renewAt.setMinutes(renewAt.getMinutes() - 120);
        this._blobConnection.renewAt = renewAt;
    }

    async uploadBlob(file, blobName, owner, speedSummaries) {
        await this._ensureService();

        let customBlockSize = file.size > 1024 * 1024 * 32 // 32 MB
            ? 1024 * 1024 * 4   // 4 MB
            : 1024 * 512;       // 512 kB

            this._blobConnection.service.singleBlobPutThresholdInBytes = customBlockSize;

        let options = {
            blockSize : customBlockSize,
            metadata: {
                owner: owner,
                filename: file.name
            }
        };

        let upload = async () => {
            try {
                let speedSummary;
                await new Promise((resolve, reject) => {
                    speedSummary = this._blobConnection.service.createBlockBlobFromBrowserFile(
                        this._blobConnection.containerName,
                        blobName,
                        file,
                        options,
                        err => err ? reject(err) : resolve());

                    speedSummaries.push(speedSummary);
                });
            } catch (exception) {
                if (speedSummary) {
                    let index = speedSummaries.indexOf(speedSummary);
                    if (index > -1) {
                        speedSummaries.splice(index, 1);
                    }
                }

                await this._ensureService(true);
                throw exception;
            }
        };

        this._retryPolicy.run(upload);

        // Inform the API that a new image has been uploaded
        await this._imageService.registerNewBlob(blobName);
    };
}