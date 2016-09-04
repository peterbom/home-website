import {inject} from "aurelia-framework";
import {DialogController} from "aurelia-dialog";

@inject(DialogController)
export class LoadingModal {

    constructor(controller){
        this.controller = controller;
    }

    activate(message) {
        this.message = message;
    }
}