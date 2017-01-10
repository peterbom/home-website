import {Page} from "./page";
import {PageSet} from "./page-set";
import {PageLinkGenerator} from "./page-link-generator";

const DefaultMaxItemCount = 10;

export class PageManager {
    getPageSet(items, maxItemCount) {
        // Create a copy of the original array
        items = (items || []).slice();
        maxItemCount = maxItemCount || DefaultMaxItemCount;

        let itemSets = [];
        while (items.length > 0) {
            itemSets.push(items.splice(0, maxItemCount));
        }

        let pages = itemSets.map((items, index) => new Page(index, items));
        return new PageSet(pages);
    }

    getPageLinkGenerator(pageSet, maxPageLinkCount) {
        return new PageLinkGenerator(pageSet, maxPageLinkCount);
    }
}