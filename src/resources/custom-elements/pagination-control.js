import {bindable} from "aurelia-framework";

export class PaginationControl {
    @bindable pageSet;
    @bindable pageLinkGenerator;

    setPageIndex(index) {
        this.pageSet.setPageIndex(index);
        this.pageLinkGenerator.generatePageLinks();
    }
}
