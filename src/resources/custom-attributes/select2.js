import {inject, customAttribute, BindingEngine, TaskQueue} from "aurelia-framework";
import * as select2 from "select2";

@customAttribute("select2")
@inject(Element, BindingEngine, TaskQueue)
export class Select2 {
    constructor (element, bindingEngine, taskQueue) {
        this._element = element;
        this._bindingEngine = bindingEngine;
        this._taskQueue = taskQueue;
        this._observer = null;
        this._subscription = null;
        this._created = false;
    }

    bind (bindingContext) {
        //this._bindingContext = overrideContext.parentOverrideContext.bindingContext;

        let valueBindingExpression = this._element.getAttribute("value.bind");
        this._observer = this._bindingEngine.expressionObserver(bindingContext, valueBindingExpression);

        this.disposeSubscription();
        this._subscription = this._observer.subscribe((newValue, oldValue) => this.expressionChanged(newValue, oldValue));
    }

    expressionChanged (newValue, oldValue) {
        console.log(`expressionChanged: ${oldValue} => ${newValue}`);
    }

    attached () {
        // http://stackoverflow.com/a/38007142
        // https://gist.run/?id=2189fda060e77e3f735ce59528df79b8
        // Need to queue a task here to allow for the child options elements to be bound.
        // If we don't do that, the HTML element won't have a value when it's populated.
        this._taskQueue.queueMicroTask(() => {
            this.create();
        });
    }

    create () {
        let value = this._observer.getValue();

        let $elem = $(this._element);
        if ($elem.val() !== value) {
            // http://stackoverflow.com/a/38925269
            $elem.val(value).trigger("change");
        }

        if (this._created) {
            return;
        }

        $(this._element).select2({
            theme: "bootstrap",
            width: "100%"
        }).on("change", (evt) => {
            if (evt.originalEvent) {
                return;
            }

            this._observer.setValue($(evt.target).val());
            this._element.dispatchEvent(new Event('change', { bubbles: true }));

            // TODO: work out what this does...
            // //reset value to avoid multiple-select problems
            // let value = this._bindingContext[this._element.getAttribute('value.bind')];
            // this._bindingContext[this._element.getAttribute('value.bind')] = [];
            // this._bindingContext[this._element.getAttribute('value.bind')] = value;
        });

        this._created = true;
    }

    destroySelect () {
        if (this._created) {
            $(this._element).select2("destroy");
            this._created = false;
        }
    }

    disposeSubscription () {
        if (this._subscription) {
            this._subscription.dispose();
            this._subscription = null;
        }
    }

    detached () {
        this.destroySelect();
        this.disposeSubscription();
    }
}
