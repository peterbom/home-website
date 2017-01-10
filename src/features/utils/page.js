export class Page {
    index;
    items;
    itemCount;

    constructor(index, items) {
        this.index = index;
        this.items = items || [];
        this.itemCount = this.items.length;
    }
}