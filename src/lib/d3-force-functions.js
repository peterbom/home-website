import * as d3 from "d3";

export class D3ForceFunctions {

    static companionForces () {
        let companionDistance = 40;
        let minAttractionDistance = 60;
        let maxAttractionDistance = 500;
        let companionLinkStrength = 1;
        let companionLinks = [];
        let nodeWeightLookup = {};

        const CompanionId = "_companionId";

        let setCompanionLinks = links => {
            companionLinks = links;
            nodeWeightLookup = {};
            for (let link of links) {
                let sourceId = link.source[CompanionId] = link.source[CompanionId] || Math.random();
                let sourceCount = nodeWeightLookup[sourceId] = nodeWeightLookup[sourceId] || 0;
                nodeWeightLookup[sourceId] = ++sourceCount;

                let targetId = link.target[CompanionId] = link.target[CompanionId] || Math.random();
                let targetCount = nodeWeightLookup[targetId] = nodeWeightLookup[targetId] || 0;
                nodeWeightLookup[targetId] = ++targetCount;
            }
        }

        // scale converting alpha to attraction distance
        let attractionDistanceScale = d3.scaleLinear()
            .domain([0, 1])
            .range([minAttractionDistance, maxAttractionDistance]);

        let getAndStoreLinkIntProperty = (link, propertyName, accessor) => {
            let value = Number.parseInt(link[propertyName]);
            if (Number.isNaN(value)) {
                value = typeof accessor === "function"
                    ? accessor(link)
                    : Number.parseInt(accessor);

                link[propertyName] = value;
            }

            return value;
        };

        let applyCompanionForces = alpha => {
            for (let link of companionLinks) {
                let linkLength = getAndStoreLinkIntProperty(link, "linkLength", companionDistance);
                let strength = getAndStoreLinkIntProperty(link, "strength", companionLinkStrength);

                let source = link.source;
                let target = link.target;

                let x = target.x - source.x;
                let y = target.y - source.y;

                let distance = Math.sqrt(x * x + y * y);
                let attractionDistance = attractionDistanceScale(alpha);

                if (distance <= attractionDistance && distance !== linkLength) {
                    let increaseProp = (linkLength - distance) / distance;

                    let sourceWeight = nodeWeightLookup[source[CompanionId]] || 0;
                    let targetWeight = nodeWeightLookup[target[CompanionId]] || 0;
                    let totalWeight = sourceWeight + targetWeight;

                    let sourceMultiplier = 1 - sourceWeight / totalWeight;
                    let targetMultiplier = 1 - sourceMultiplier;

                    let sourcePull = {
                        x: (-x) * increaseProp * sourceMultiplier * alpha * strength,
                        y: (-y) * increaseProp * sourceMultiplier * alpha * strength
                    };

                    let targetPull = {
                        x: x * increaseProp * targetMultiplier * alpha * strength,
                        y: y * increaseProp * targetMultiplier * alpha * strength
                    };

                    source.vx += sourcePull.x;
                    source.vy += sourcePull.y;

                    target.vx += targetPull.x;
                    target.vy += targetPull.y;
                }
            }
        }

        applyCompanionForces.links = val => {setCompanionLinks(val); return applyCompanionForces;};
        applyCompanionForces.distance = val => {companionDistance = val; return applyCompanionForces;};
        applyCompanionForces.minAttractionDistance = val => {minAttractionDistance = val; return applyCompanionForces;};
        applyCompanionForces.maxAttractionDistance = val => {maxAttractionDistance = val; return applyCompanionForces;};
        applyCompanionForces.strength = val => {companionLinkStrength = val; return applyCompanionForces;};

        return applyCompanionForces;
    }

    static boundsRestriction() {
        let top = 0;
        let bottom = 500;
        let left = 0;
        let right = 500;
        let margin = 10;
        let nodes = [];

        function keepWithinBounds () {
            let minX = left + margin;
            let minY = top + margin;
            let maxX = right - margin;
            let maxY = bottom - margin;

            for (let node of nodes) {
                let nextPos = {
                    x: node.x + node.vx,
                    y: node.y + node.vy
                };

                let reverseX = (nextPos.x < minX) || (nextPos.x > maxX);
                let reverseY = (nextPos.y < minY) || (nextPos.y > maxY);

                if (reverseX) {
                    node.x = nextPos.x < minX ? minX : maxX;
                    node.vx = -node.vx;
                }

                if (reverseY) {
                    node.y = nextPos.y < minY ? minY : maxY;
                    node.vy = -node.vy;
                }
            }
        }

        keepWithinBounds.initialize = val => nodes = val;
        keepWithinBounds.top = val => {top = val; return keepWithinBounds;};
        keepWithinBounds.bottom = val => {bottom = val; return keepWithinBounds;};
        keepWithinBounds.left = val => {left = val; return keepWithinBounds;};
        keepWithinBounds.right = val => {right = val; return keepWithinBounds;};
        keepWithinBounds.margin = val => {margin = val; return keepWithinBounds;};

        return keepWithinBounds;
    }
}