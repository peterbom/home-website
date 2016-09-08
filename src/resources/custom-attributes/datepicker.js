import {inject, customAttribute} from "aurelia-framework";
import * as datetimepicker from "jquery-datetimepicker";

@customAttribute("datepicker")
@inject(Element)
export class DatePicker {
    constructor (element) {
        this._element = element;
    }

    attached () {
        $(this._element)
            .datetimepicker()
            .on("change", e => fireEvent(e.target, "input"));
    }
}

function fireEvent(element, name) {
    let event = document.createEvent("Event");
    event.initEvent(name, true, true);
    element.dispatchEvent(event);
}