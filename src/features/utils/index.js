import {PageManager} from "./page-manager";

export function configure(aurelia, settings) {
    let pageManager = new PageManager();
    aurelia.container.registerInstance("page-manager", pageManager);
}
