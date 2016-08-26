import {inject, NewInstance} from "aurelia-framework";
import {Router} from "aurelia-router";
import {Endpoint} from "aurelia-api";
import {ValidationController, validateTrigger} from "aurelia-validation";
import {ValidationRules} from "aurelia-validatejs";

import {replacePlaceholdersWithVariables} from "../shared/formula-utils";

@inject(Endpoint.of("packaging"), Router, NewInstance.of(ValidationController))
export class Edit {

    id;

    fefcoEsboCode;
    name;

    pieceLengthFormula;
    pieceWidthFormula;
    lengthwiseScoringAllowanceFormula;
    widthwiseScoringAllowanceFormula;

    updateVersion;

    variables = [];

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
        let constructionStyle = await this._endpoint.find("construction-styles", params.id);

        this.id = params.id;

        this.name = constructionStyle.name;
        this.fefcoEsboCode = constructionStyle.fefcoEsboCode;

        this.pieceLengthFormula = replacePlaceholdersWithVariables(
            constructionStyle.pieceLengthFormulaText, constructionStyle.variables);
        this.pieceWidthFormula = replacePlaceholdersWithVariables(
            constructionStyle.pieceWidthFormulaText, constructionStyle.variables);
        this.lengthwiseScoringAllowanceFormula = replacePlaceholdersWithVariables(
            constructionStyle.lengthwiseScoringAllowanceFormulaText, constructionStyle.variables);
        this.widthwiseScoringAllowanceFormula = replacePlaceholdersWithVariables(
            constructionStyle.widthwiseScoringAllowanceFormulaText, constructionStyle.variables);

        this.updateVersion = constructionStyle.updateVersion;

        this.variables = constructionStyle.variables;
    }

    async save() {
        let errors = this._validationController.validate();
        if (errors.length > 0) {
            return;
        }

        await this._endpoint.update("construction-styles", this.id, {
            fefcoEsboCode: this.fefcoEsboCode,
            name: this.name,
            pieceLengthFormula: this.pieceLengthFormula,
            pieceWidthFormula: this.pieceWidthFormula,
            lengthwiseScoringAllowanceFormula: this.lengthwiseScoringAllowanceFormula,
            widthwiseScoringAllowanceFormula: this.widthwiseScoringAllowanceFormula,
            updateVersion: this.updateVersion
        });

        let url = this._router.generate("construction-style-list");
        this._router.navigate(url);
    }
}