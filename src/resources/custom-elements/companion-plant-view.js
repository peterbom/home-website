import {inject, bindable, bindingMode, BindingEngine, CompositionTransaction} from "aurelia-framework";
import {Endpoint} from "aurelia-api";
import * as d3 from "d3";
import {PlantUtils} from "../../lib/plant-utils";
import {D3ForceFunctions} from "../../lib/d3-force-functions";

@inject(Element, Endpoint.of("main"), BindingEngine, CompositionTransaction)
export class CompanionPlantView {
    @bindable width;
    @bindable height;
    @bindable selectedTsns = [];
    @bindable selectedNameView = "common";

    svgElem; // From ref attribute
    svg;
    linksGroup;

    plantLookup;
    companionLinks;
    simulation;

    constructor (element, endpoint, bindingEngine, compositionTransaction) {
        this._element = element;
        this._endpoint = endpoint;
        this._bindingEngine = bindingEngine;

        // https://github.com/aurelia/framework/issues/367
        this.compositionTransactionNotifier = compositionTransaction.enlist();        
    }

    selectedNameViewChanged () {
        this.refreshView();
    }

    selectedTsnsChanged () {
        this.refreshView();
    }

    async created () {
        this._subscription = this._bindingEngine.collectionObserver(this.selectedTsns)
            .subscribe(splices => this.refreshView());

        let [plants, hierarchyLinks, companionLinks] = await Promise.all([
            this._endpoint.find("plant"),
            this._endpoint.find("plant-link"),
            this._endpoint.find("plant-companion")
        ]);

        this.plantLookup = {};
        plants.forEach(p => this.plantLookup[p._id] = p);

        let flattenedCompanionLinks = PlantUtils.flattenCompanionList(companionLinks);

        this.companionLinks = PlantUtils.getLeafNodeCompanionLinks(
            flattenedCompanionLinks, hierarchyLinks, this.plantLookup);

        this.svg = d3.select(this.svgElem);
        this.svg.on("click", () => {
            // Deselect everything
            this.setLineSelection(d3.selectAll([]));
            this.setNodeSelection(d3.selectAll([]));
        });

        let defs = this.svg.append("svg:defs");
        defs.selectAll("marker")
            .data([
                {id: "help-end", class: "help"},
                {id: "hinder-end", class: "hinder"},
                {id: "help-end-selected", class: "help selected"},
                {id: "hinder-end-selected", class: "hinder selected"}
            ])
            .enter()
            .append("svg:marker")
            .attr("id", d => d.id)
            .attr("viewBox", "0 -5 10 10")
            .attr("refX", 14)
            .attr("refY", 0)
            .attr("markerWidth", 6)
            .attr("markerHeight", 6)
            .attr("orient", "auto")
            .append("svg:path")
            .attr("d", "M0,-5L10,0L0,5")
            .attr("class", d => `companion-plant-arrow ${d.class}`);

        this.linksGroup = this.svg.append("g")
            .attr("class", "companion-plant-links");

        let distanceScale = d3.scaleOrdinal()
            .domain(["help", "hinder"])
            .range([40, 300]);

        let strengthScale = d3.scaleOrdinal()
            .domain(["help", "hinder"])
            .range([1, 3]);

        this.simulation = d3.forceSimulation()
            .force("charge", d3.forceManyBody().distanceMax(100).distanceMin(5).strength(-30))
            .force("collide", d3.forceCollide(25).strength(1).iterations(1))
            .force("companion-force", D3ForceFunctions.companionForces()
                .links([])
                .distance(link => distanceScale(link.effect))
                .strength(link => strengthScale(link.effect))
                .minAttractionDistance(distanceScale("help") * 1.5)
                .maxAttractionDistance(Math.min(this.width, this.height)))
            .force("center", d3.forceCenter(this.width / 2, this.height / 2))
            .force("contain", D3ForceFunctions.boundsRestriction()
                .top(0).left(0).bottom(this.height).right(this.width).margin(10));

        // done loading data, allow the attached() hook to fire
        this.compositionTransactionNotifier.done();
        this._created = true;
    }

    attached () {
        this.refreshView();
    }

    refreshView() {
        if (!this._created) {
            return;
        }

        let selectedTsnLookup = {};
        this.selectedTsns.forEach(tsn => selectedTsnLookup[tsn] = true);

        // Filter the nodes and links according to the selected TSNs
        let nodes = this.selectedTsns.map(tsn => this.plantLookup[tsn]);
        let links = this.companionLinks.filter(l => selectedTsnLookup[l.source._id] && selectedTsnLookup[l.target._id]);

        // Link elements
        let linkUpdateSelection = this.linksGroup
            .selectAll("line")
            .data(links);

        let linkNewSelection = linkUpdateSelection.enter()
            .append("line")
            .attr("class", d => `${d.effect}`)
            .attr("marker-end", d => `url(#${d.effect}-end)`)
            .on("click", d => {
                this.setLineSelection(d3.select(d3.event.target));
                this.setNodeSelection(nodeSelection.filter(dn => dn === d.source || dn === d.target));
                d3.event.stopPropagation();
            });

        linkUpdateSelection.exit().remove();

        let linkSelection = linkUpdateSelection.merge(linkNewSelection)
            .attr("title", d => JSON.stringify(d.details, null, 2));

        // Node elements
        let nodeUpdateSelection = this.svg
            .selectAll(".companion-plant-node")
            .data(nodes);

        let nodeNewSelection = nodeUpdateSelection.enter()
            .append("g")
            .attr("class", "companion-plant-node")
            .on("click", d => {
                this.setNodeSelection(nodeSelection.filter(dn => dn === d));
                this.setLineSelection(linkSelection.filter(dl => dl.source === d));
                d3.event.stopPropagation();
            });

        nodeNewSelection.append("circle")
            .attr("class", d => d.use);

        nodeNewSelection.append("text")
            .attr("dx", 12)
            .attr("dy", ".35em");

        nodeUpdateSelection.exit().remove();

        let nodeSelection = nodeUpdateSelection.merge(nodeNewSelection);

        nodeSelection.select("circle")
            .call(d3.drag()
                .on("start", d => {
                    if (!d3.event.active) this.simulation.alphaTarget(0.1).restart();
                    d.fx = d.x;
                    d.fy = d.y;
                })
                .on("drag", d => {
                    d.fx = d3.event.x;
                    d.fy = d3.event.y;
                })
                .on("end", d => {
                    if (!d3.event.active) this.simulation.alphaTarget(0);
                    d.fx = null;
                    d.fy = null;
                }));

        nodeSelection.select("text")
            .text(d => PlantUtils.getName(d, this.selectedNameView));

        this.simulation.nodes(nodes);
        this.simulation.force("companion-force")
            .links(links)
            .maxAttractionDistance(Math.min(this.width, this.height));
        this.simulation.force("center", d3.forceCenter(this.width / 2, this.height / 2));
        this.simulation.force("contain").bottom(this.height).right(this.width);
        this.simulation.on("tick", () => {
            linkSelection
                .attr("x1", d => d.source.x)
                .attr("y1", d => d.source.y)
                .attr("x2", d => d.target.x)
                .attr("y2", d => d.target.y);

            nodeSelection
                .attr("transform", d => `translate(${d.x},${d.y})`);
        }).alpha(1).restart();
    }

    _lineSelection;
    setLineSelection(selection) {
        if (this._lineSelection) {
            this._lineSelection.classed("selected", false).attr("marker-end", d => `url(#${d.effect}-end)`);
        }
    
        this._lineSelection = selection;
        if (this._lineSelection) {
            this._lineSelection.classed("selected", true).attr("marker-end", d => `url(#${d.effect}-end-selected)`);
        }
    };

    _nodeSelection;
    setNodeSelection(selection) {
        if (this._nodeSelection) {
            this._nodeSelection.select("circle").classed("selected", false);
        }
    
        this._nodeSelection = selection;
        if (this._nodeSelection) {
            this._nodeSelection.select("circle").classed("selected", true);
        }
    };

    deactivate() {
        this._subscription.dispose();
    }
}