export class BlobService {
    constructor(endpoint) {
        this._endpoint = endpoint;

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
    }

    async _ensureService() {
        if (this._blobConnection && this._blobConnection.service && this._blobConnection.renewAt > new Date()) {
            return;
        }

        let blobTokenInfo = await this._endpoint.find("blob-container-token");
        // Response:
        // {
        //     "token": "<SAS token>",
        //     "host": {
        //         "primaryHost": "https://host1.net/",
        //         "secondaryHost": "https://host2.net"
        //     },
        //     "container": "images",
        //     "expiry": "2017-09-21T00:59:29.5506411+12:00"
        // }
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

    async uploadBlob(file, blobName, owner, speedSummaryHandler) {
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

        await new Promise((resolve, reject) => {
            let speedSummary = this._blobConnection.service.createBlockBlobFromBrowserFile(
                this._blobConnection.containerName,
                blobName,
                file,
                options,
                err => err ? reject(err) : resolve());

            speedSummaryHandler(speedSummary);
        });

        // Inform the API that a new image has been uploaded
        // POST to: image-registration/<image-name>
        await this._endpoint.post(`image-registration/${blobName}`);
    };
}