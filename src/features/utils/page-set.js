export class PageSet {
    pages;
    pageCount;

    currentPageIndex;
    currentPage;
    hasPreviousPage;
    hasNextPage;

    constructor(pages) {
        this.pages = pages || [];
        this.pageCount = this.pages.length;

        if (pages.length) {
            this.setPageIndex(0);
        } else {
            this.currentPageIndex = null;
            this.currentPage = null;
            this.hasPreviousPage = false;
            this.hasNextPage = false;
        }
    }

    setPageIndex(pageIndex) {
        if (pageIndex < 0 || pageIndex >= this.pageCount) {
            throw new Error(`Page index ${pageIndex} out of range`);
        }

        this.currentPageIndex = pageIndex;
        this.currentPage = this.pages[pageIndex];
        this.hasPreviousPage = pageIndex > 0;
        this.hasNextPage = (pageIndex + 1) < this.pageCount;
    }

    goBack() {
        this.setPageIndex(Math.max(0, this.currentPageIndex - 1));
    }

    goForward() {
        this.setPageIndex(Math.min(this.pageCount - 1, this.currentPageIndex + 1));
    }
}