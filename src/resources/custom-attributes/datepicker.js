import {inject, customAttribute} from "aurelia-framework";
import * as datetimepicker from "jquery-datetimepicker";

@customAttribute("datepicker")
@inject(Element)
export class DatePicker {
    constructor (element) {
        this._element = element;
    }

    attached () {
        // http://xdsoft.net/jqplugins/datetimepicker/
        $(this._element)
            .datetimepicker({
                formatTime: "H:i:s",  // http://php.net/manual/en/function.date.php
                validateOnBlur: false,
                step: 600
            })
            .on("change", e => fireEvent(e.target, "input"));
    }
}

function fireEvent(element, name) {
    let event = document.createEvent("Event");
    event.initEvent(name, true, true);
    element.dispatchEvent(event);
}