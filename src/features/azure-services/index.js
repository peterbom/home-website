import {Config as ApiConfig} from "aurelia-api";

import {BlobService} from "./blob-service";
import {ImageService} from "./image-service";

/**
 * Configure the plugin.
 *
 * @param {{globalResources: Function, container: {Container}}} aurelia
 * @param {{}}                                         settings
 */
export function configure(aurelia, settings) {
    // Dependencies which can be resolved by the container (i.e. need no more custom configuration)
    let apiConfig = aurelia.container.get(ApiConfig);

    // Create other dependencies according to configuration
    let functionEndpoint = apiConfig.getEndpoint("function");
    let blobService = new BlobService(functionEndpoint);
    let imageService = new ImageService(functionEndpoint);

    // Register all new'ed up dependencies with the container so we always resolve
    // the same instances in future.
    aurelia.container.registerInstance("blob-service", blobService);
    aurelia.container.registerInstance("image-service", imageService);
}
