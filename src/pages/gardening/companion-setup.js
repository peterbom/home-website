import {inject, NewInstance} from "aurelia-framework";
import {Endpoint} from "aurelia-api";
import {PlantUtils} from "../../lib/plant-utils";

@inject(Endpoint.of("main"))
export class CompanionSetup {

    selectedNameView = "common";
    nameViews = ["common", "scientific"];

    plants = [];
    plantMap;
    plantCompanions = [];

    json;

    constructor (endpoint) {
        this._endpoint = endpoint;
    }

    async activate (params) {
        [this.plants, this.plantCompanions] = await Promise.all([
            this._endpoint.find("plant"),
            this._endpoint.find("plant-companion")
        ]);

        this.plants.forEach(p => p.commonName = p.commonName || `(${p.scientificName})`);

        this.plantMap = new Map(this.plants.map(p => [p._id, p]));
    }

    setEditable(companion) {
        companion.editValues = {
            isNew: false,
            plantTsn: companion._id,
            helpsTsns: companion.helps.map(tsn => `${tsn}`),
            hindersTsns: companion.hinders.map(tsn => `${tsn}`)
        };
    }

    addNew() {
        this.plantCompanions.push({
            editValues: {
                isNew: true,
                plantTsn: null,
                helpsTsns: [],
                hindersTsns: []
            }
        });
    }

    async save(companion) {
        if (!companion.editValues) {
            return;
        }

        let tsn = Number.parseInt(companion.editValues.plantTsn);
        if (Number.isNaN(tsn)) {
            return;
        }

        let helps = (companion.editValues.helpsTsns || []).map(tsn => Number.parseInt(tsn));
        let hinders = (companion.editValues.hindersTsns || []).map(tsn => Number.parseInt(tsn));
        if (!helps.length && !hinders.length) {
            return;
        }

        await this._endpoint.update("plant-companion", tsn, { helps: helps, hinders: hinders });

        companion.helps = helps;
        companion.hinders = hinders;
        if (companion.editValues.isNew) {
            companion._id = tsn;
        }

        companion.editValues = null;
    }

    async delete(companion) {
        await this._endpoint.destroy("plant-companion", companion._id);
        let index = this.plantCompanions.indexOf(companion);
        this.plantCompanions.splice(index, 1);
    }

    cancel(companion) {
        if (companion.editValues.isNew) {
            let index = this.plantCompanions.indexOf(companion);
            this.plantCompanions.splice(index, 1);
        }

        companion.editValues = null;
    }

    async getJson() {
        // Flatten companion data into a flat list with structure:
        // [{"source": tsn1, "target": tsn2, "effect": "<help/hinder>"}]
        let companionLinks = PlantUtils.flattenCompanionList(this.plantCompanions);

        // Get all the TSNs that are directly involved in companion relationships
        let tsns = getRelevantTsns(companionLinks)

        // Retrieve hierarchy data to find all parents and children of these TSNs
        // as [{_id, parentId}, ...]
        let hierarchyLinks = await this._endpoint.find("plant-link");

        // Add the parents and children of all TSNs
        tsns = PlantUtils.getParentAndChildTsns(tsns, hierarchyLinks);

        let tsnLookup = {};
        tsns.forEach(tsn => tsnLookup[tsn] = true);

        // Get all the plants and filter according to the relevant TSNs
        let plants = await this._endpoint.find("plant");
        plants = plants.filter(p => tsnLookup[p._id]);

        /*
{
    "42782": {"scientificName": "Asparagus", "commonName": "asparagus", "use": "vegetable"},
    ...
}
        */
        let plantLookup = {};
        plants.forEach(p => plantLookup[p._id] = {
            scientificName: p.scientificName,
            commonName: p.commonName,
            use: p.use
        });

        // Get "help" and "hinder" references, with structure:
        // [{"_id": <id>, "type": "<companion-help/hinder>", "key": "<sourceTsn>-<targetTsn>", "url": "<url>", ...}, ...]
        let [helpReferences, hinderReferences] = await Promise.all([
            this._endpoint.find("plant-reference/companion-help"),
            this._endpoint.find("plant-reference/companion-hinder")
        ]);

        // Create a reference lookup based on source and target TSN
        let referenceLookup = PlantUtils.getReferenceLookup(helpReferences, hinderReferences);

        let value = {
            plantLookup: plantLookup,
            hierarchyLinks: hierarchyLinks.filter(l => tsnLookup[l._id] && tsnLookup[l.parentId]),
            companionLinks: companionLinks,
            referenceLookup: referenceLookup
        };

        this.json = JSON.stringify(value);
// /*
// [
//     {"source": 42782, "helps": [12345, 3534,24241], "hinders": []}
// ]
// */
//         let values = this.plantCompanions.map(pc => ({
//             source: pc._id,
//             helps: pc.helps,
//             hinders: pc.hinders
//         }));

//         this.json = JSON.stringify(values);
    }
}