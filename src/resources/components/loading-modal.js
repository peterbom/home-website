import {inject} from "aurelia-framework";
import {DialogController} from "aurelia-dialog";

@inject(DialogController)
export class LoadingModal {

    message;
    progressPercent;

    constructor(controller){
        this.controller = controller;
        this.progressPercent = 0;
    }

    activate(params) {
        if (typeof params === "string") {
            this.message = params;
            this.progressPercent = 100;
        } else if (typeof params === "object") {
            this.message = params.message;
            this.progressPercent = params.progressPercent;
        }
    }
}