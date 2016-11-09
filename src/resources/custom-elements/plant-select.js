import {inject, bindable, bindingMode, CompositionTransaction} from "aurelia-framework";
import {Endpoint} from "aurelia-api";
import * as d3 from "d3";
import {PlantUtils} from "../../lib/plant-utils";

@inject(Element, Endpoint.of("main"), CompositionTransaction)
export class PlantSelect {
    @bindable({ defaultBindingMode: bindingMode.twoWay }) width;
    @bindable({ defaultBindingMode: bindingMode.twoWay }) height;
    @bindable multiple = false;
    @bindable prune = true;
    @bindable selectedNameView = "common";

    @bindable({ defaultBindingMode: bindingMode.twoWay }) selectedTsns;
    get selectedTsn () {
        return this.selectedTsns && this.selectedTsns.length === 1 ? this.selectedTsns[0] : null;
    }

    plants;
    hierarchyLinks;
    rootNode;
    
    svgElem; // From ref attribute
    svg;
    useColorScale;
    containerGroup;
    nodeSelection;

    constructor (element, endpoint, compositionTransaction) {
        this._element = element;
        this._endpoint = endpoint;

        // https://github.com/aurelia/framework/issues/367
        this.compositionTransactionNotifier = compositionTransaction.enlist();        
    }

    selectedNameViewChanged () {
        this.refreshView();
    }

    async created () {
        [this.plants, this.hierarchyLinks] = await Promise.all([
            this._endpoint.find("plant"),
            this._endpoint.find("plant-link")
        ]);

        let parentMap = d3.map(this.hierarchyLinks, d => d._id);
        let stratify = d3.stratify()
            .id(d => d._id)
            .parentId(d => {
                let link = parentMap.get(d._id);
                if (link && parentMap.has(link.parentId)) {
                    return link.parentId;
                }

                return null;
            });

        this.rootNode = stratify(this.plants);
        this.rootNode.descendants().forEach(d => d.data.selected = true);

        if (this.prune) {
            // TODO: prune single-child intermediate nodes
            while (this.rootNode.children.length === 1) {
                this.rootNode = this.rootNode.children[0];
            }
        }

        this.width = this.rootNode.height * 100 + 200;
        this.height = this.rootNode.leaves().length * 20;

        this.svg = d3.select(this.svgElem);
        this.svg.attr("width", this.width).attr("height", this.height);
        this.containerGroup = this.svg.append("g").attr("transform", "translate(100,0)");

        this.useColorScale = d3.scaleOrdinal()
            .domain(["vegetable", "fruit", "herb", "flower", "unspecified"])
            .range(["#ff9f9f", "#ffd59f", "#fffc9f", "#9fffb3", "#aaa"]);

        let defs = this.svg.append("svg:defs");
        defs.selectAll("radialGradient")
            .data(this.useColorScale.domain())
            .enter()
            .append("svg:radialGradient")
            .attr("id", d => `selected-node-gradient-${d}`)
            .selectAll("stop")
            .data(d => [
                {offset: "50%", stopColor: this.useColorScale(d)},
                {offset: "75%", stopColor: "rgb(255,255,255)"}
            ])
            .enter()
            .append("svg:stop")
            .attr("offset", d => d.offset)
            .attr("stop-color", d => d.stopColor);

        // done loading data, allow the attached() hook to fire
        this.compositionTransactionNotifier.done();
        this._created = true;
    }

    refreshView () {
        if (!this._created) {
            return;
        }

        this.rootNode.sort((a, b) =>
            (a.height - b.height) ||
            PlantUtils.getName(a.data, this.selectedNameView).localeCompare(PlantUtils.getName(b.data, this.selectedNameView)));

        let tree = d3.cluster()
            .size([this.height, this.width - 200]);

        tree(this.rootNode);

        let linkUpdateSelection = this.containerGroup.selectAll(".plant-selection-link")
            .data(this.rootNode.descendants().slice(1));

        let linkNewSelection = linkUpdateSelection.enter()
            .append("path")
            .attr("class", "plant-selection-link");

        let linkSelection = linkUpdateSelection.merge(linkNewSelection)
            .attr("d", d => `M${d.y},${d.x} C${d.parent.y + 100},${d.x} ${d.parent.y + 100},${d.parent.x}, ${d.parent.y},${d.parent.x}`);

        let nodeUpdateSelection = this.containerGroup
            .selectAll(".plant-selection-node")
            .data(this.rootNode.descendants());

        let nodeNewSelection = nodeUpdateSelection.enter()
            .append("g")
            .attr("class", "plant-selection-node")
            .classed("node--internal", d => d.children)
            .classed("node--leaf", d => !d.children);

        nodeNewSelection.append("circle")
            .on("mouseover", d => d3.select(d3.event.target).style("cursor", "pointer"))
            .on("mouseout", d => d3.select(d3.event.target).style("cursor", "default"))
            .on("click", d => this.toggleSelection(d));

        nodeNewSelection.append("text");

        this.nodeSelection = nodeUpdateSelection.merge(nodeNewSelection)
            .attr("transform", d => `translate(${d.y},${d.x})`)
            .classed("selected", d => d.data.selected);

        this.nodeSelection.select("text")
            .attr("dy", 3)
            .attr("x", d => d.children ? -12 : 12)
            .style("text-anchor", d => d.children ? "end" : "start")
            .text(d => PlantUtils.getName(d.data, this.selectedNameView));

        this.nodeSelection.select("circle")
            .attr("stroke", d => this.useColorScale(d.data.use || "unspecified"));

        this.refreshSelection();
    }

    async attached () {
        this.refreshView();
    }

    toggleSelection (node) {
        let selected = !node.data.selected;
        if (this.multiple) {
            let descendants = node.descendants();
            descendants.forEach(n => n.data.selected = selected);
        } else {
            let allNodes = this.rootNode.descendants();
            allNodes.forEach(n => n.data.selected = n === node);
        }

        this.refreshSelection();
    }

    refreshSelection () {
        this.nodeSelection
            .classed("selected", d => d.data.selected)
            .select("circle")
            .attr("fill", d => d.data.selected ? `url(#selected-node-gradient-${d.data.use || "unspecified"})` : "#fff");

        // As far as our consumers are concerned, only the leaf
        // nodes are selectable.
        let selectedTsns = this.rootNode.leaves()
            .filter(n => n.data.selected)
            .map(n => n.data._id);

        // this.selectedTsns.length = 0;
        // this.selectedTsns.push(...selectedTsns);
        this.selectedTsns = selectedTsns;

        this.raiseChangeEvent();
    }

    raiseChangeEvent() {
        this._element.dispatchEvent(new Event("change", { bubbles: true }));
    }
}
