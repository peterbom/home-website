import {inject, NewInstance} from "aurelia-framework";
import {Router} from "aurelia-router";
import {Endpoint} from "aurelia-api";
import {ValidationController, validateTrigger} from "aurelia-validation";
import {ValidationRules} from "aurelia-validatejs";

@inject(Endpoint.of("main"), Router, NewInstance.of(ValidationController))
export class Edit {

    constructionStyle;

    // Validation rules
    rules;

    constructor (endpoint, router, validationController) {
        this._endpoint = endpoint;
        this._router = router;
        this._validationController = validationController;

        //this._validationController.validateTrigger = validateTrigger.change;
        this.rules = ValidationRules
            .ensure("name").required()
            .ensure("fefcoEsboCode").required();
    }

    async activate (params) {
        this.constructionStyle = await this._endpoint.find("packaging/construction-style", params.id);
    }

    async save() {
        let errors = this._validationController.validate();
        if (errors.length > 0) {
            return;
        }

        await this._endpoint.update("packaging/construction-style", this.constructionStyle.id, this.constructionStyle);
        let url = this._router.generate("construction-style-list");
        this._router.navigate(url);
    }
}