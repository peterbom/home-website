import {inject, NewInstance} from "aurelia-framework";
import {Router} from "aurelia-router";
import {Endpoint} from "aurelia-api";
import {ValidationController, validateTrigger} from "aurelia-validation";
import {ValidationRules} from "aurelia-validatejs";

@inject(Endpoint.of("main"), Router, NewInstance.of(ValidationController))
export class Edit {
    boxShortCode = "0010-002-0";
    isMainComponent = true;
    name = "กล่องดินสอ";
    printedName;
    sheetboardFluteTypeId;
    sheetboardFluteTypes = [
        {id: 1, fluteTypeText: "BC"},
        {id: 2, fluteTypeText: "C"}
    ];
    sheetboardSpecificationId;
    allSheetboardSpecifications = [
        {id: 1, formTypeCode: "DBL_WALL", sheetboardFluteTypeId: 1, paperGradesText: "A150 / I150"}
    ];
    filteredSheetboardSpecifications = [];
    sheetboardFormTypeText; // E.g. "Single Wall"
    constructionStyleId;
    constructionStyles = [
        {id: 1, name: "RSC/ฝาชน (flaps meet half way)"}
    ];
    length;
    width;
    depth;
    sheetSizeExtraPropertyValues = [
        {extraPropertyId: 1, value: 100, dataTypeCode: "INTEGER", propertyName: "Top Flap Size"}
    ];

    constructor (endpoint, router, validationController) {
        this._endpoint = endpoint;
        this._router = router;
        this._validationController = validationController;

        this.rules = ValidationRules
            .ensure("name").required();
    }
}