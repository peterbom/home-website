import {inject, bindable, bindingMode} from "aurelia-framework";

@inject(Element)
export class ImageFileSelector {

    @bindable acceptFileTypes = "image/*";

    // from ref attribute
    containerElem;
    inputElem;

    fileList;  // bound to file selector
    selectedFiles = [];

    constructor(element) {
        this._element = element;
    }

    get filesDescription () {
        return this.selectedFiles.length > 1
            ? `${this.selectedFiles.length} files selected`
            : this.selectedFiles[0].name;
    }

    attached() {
        // Prevent files accidently dropped elsewhere in the window from loading in the browser.
        window.addEventListener("dragover", e => {
            e = e || event;
            e.preventDefault();
        }, false);
        
        window.addEventListener("drop", e => {
            e = e || event;
            e.preventDefault();
        }, false);

        ["drag", "dragstart", "dragend", "dragover", "dragenter", "dragleave", "drop"].forEach(event => {
            this.containerElem.addEventListener(event, e => {
                e.preventDefault();
                e.stopPropagation();
            });
        });

        ["dragover", "dragenter"].forEach(event => {
            this.containerElem.addEventListener(event, e => {
                this.containerElem.classList.add("is-dragover");
            });
        });

        ["dragleave", "dragend", "drop"].forEach(event => {
            this.containerElem.addEventListener(event, e => {
                this.containerElem.classList.remove("is-dragover");
            });
        });

        this.containerElem.addEventListener("drop", e => this.setFileList(e.dataTransfer.files));
    }

    handleFileListChanged() {
        this.setFileList(this.fileList);

        // Release the file objects held by the file input element
        // http://stackoverflow.com/a/35323290
        this.fileList = null;
        this.inputElem.type = "";
        this.inputElem.type = "file";
    }

    setFileList(fileList) {
        this.selectedFiles = [];
        for (let i = 0; i < fileList.length; i++) {
            this.selectedFiles.push(fileList.item(i));
        }

        this.raiseSelectedEvent();
    }

    raiseSelectedEvent() {
        this._element.dispatchEvent(new Event("selected", { bubbles: true }));
    }
}
