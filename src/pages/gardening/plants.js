import {inject, NewInstance} from "aurelia-framework";
import {Endpoint} from "aurelia-api";

@inject(Endpoint.of("main"))
export class Plants {

    plants = [];
    links = [];

    sorting = {
        scientificName: false,
        commonName: false,
        rankName: false,
        use: false
    };

    json;

    plantUsages = [
        "vegetable",
        "fruit",
        "herb",
        "flower"
    ];

    constructor (endpoint) {
        this._endpoint = endpoint;
    }

    async activate (params) {
        [this.plants, this.links] = await Promise.all([
            this._endpoint.find("plant"),
            this._endpoint.find("plant-link")
        ]);
    }

    setEditable(plant) {
        plant.editValues = {
            isNew: false,
            tsn: plant._id,
            scientificName: plant.scientificName,
            commonName: plant.commonName,
            rankName: plant.rankName,
            use: plant.use
        };
    }

    async save(plant) {
        if (!plant.editValues) {
            return;
        }

        let tsn = Number.parseInt(plant.editValues.tsn);
        if (Number.isNaN(tsn)) {
            return;
        }

        await this._endpoint.update("plant", tsn, { 
            scientificName: plant.editValues.scientificName,
            commonName: plant.editValues.commonName,
            rankName: plant.editValues.rankName,
            use: plant.editValues.use
        });

        plant.scientificName = plant.editValues.scientificName;
        plant.commonName = plant.editValues.commonName;
        plant.rankName = plant.editValues.rankName;
        plant.use = plant.editValues.use;

        plant.editValues = null;
    }

    cancel(plant) {
        if (plant.editValues.isNew) {
            let index = this.plants.indexOf(plant);
            this.plants.splice(index, 1);
        }

        plant.editValues = null;
    }

    setSortBy(column) {
        for (let col in this.sorting) {
            if (col === column) {
                this.sorting[col] = this.sorting[col] === "asc" ? "desc" : "asc";
            } else {
                this.sorting[col] = false;
            }
        }
    }

    sortByScientificName() {
        this.setSortBy("scientificName");
        let isReverse = this.sorting.scientificName === "desc";
        this.plants.sort(getSortByFunction("scientificName", isReverse));
    }

    sortByCommonName() {
        this.setSortBy("commonName");
        let isReverse = this.sorting.commonName === "desc";
        this.plants.sort(getSortByFunction("commonName", isReverse));
    }

    sortByRank() {
        this.setSortBy("rankName");
        let isReverse = this.sorting.rankName === "desc";
        this.plants.sort(getSortByFunction("rankName", isReverse));
    }

    sortByUse() {
        this.setSortBy("use");
        let isReverse = this.sorting.use === "desc";
        this.plants.sort(getSortByFunction("use", isReverse));
    }

    getPlantJson() {
        /*
{
    "42782": {"scientificName": "Asparagus", "commonName": "asparagus", "use": "vegetable"},
    ...
}
        */
        let value = {};
        this.plants.forEach(p => value[p._id] = {
            scientificName: p.scientificName,
            commonName: p.commonName,
            use: p.use
        });

        this.json = JSON.stringify(value);
    }
}

// http://stackoverflow.com/a/979325
function getSortByFunction(field, reverse, primer) {
    let key = primer ? 
        x => primer(x[field]) : 
        x => x[field];

    let multiplier = reverse ? -1 : 1;

    return (a, b) => {
        a = key(a);
        b = key(b);

        let sortVal = (a < b) ? -1 : ((a > b) ? 1 : 0);
        return sortVal * multiplier;
    };
}