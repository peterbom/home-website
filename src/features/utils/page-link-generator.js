const DefaultMaxPageLinkCount = 10;

export class PageLinkGenerator {
    pageSet;

    maxPageLinkCount;

    pageLinks = [];
    firstPageIndex;
    lastPageIndex;

    constructor(pageSet, maxPageLinkCount) {
        this.pageSet = pageSet;
        this.maxPageLinkCount = maxPageLinkCount || DefaultMaxPageLinkCount;

        this.generatePageLinks();
    }

    generatePageLinks() {
        // The pages to display are the 'maxPageLinkCount' surrounding the current page
        let maxFirstPageIndex = Math.max(0, this.pageSet.pageCount - this.maxPageLinkCount);
        
        this.firstPageIndex = this.pageSet.currentPageIndex - (this.maxPageLinkCount / 2);
        this.firstPageIndex = Math.min(this.firstPageIndex, maxFirstPageIndex);
        this.firstPageIndex = Math.max(this.firstPageIndex, 0);

        this.lastPageIndex = this.firstPageIndex + this.maxPageLinkCount - 1;
        this.lastPageIndex = Math.min(this.lastPageIndex, this.pageSet.pageCount - 1);

        this.pageLinks = this.pageSet.pages
            .filter(p => p.index >= this.firstPageIndex && p.index <= this.lastPageIndex)
            .map(p => ({
                index: p.index,
                selected: p.index === this.pageSet.currentPageIndex
            }));
    }
}