export class PlantUtils {
    static getName(plant, nameView) {
        switch (nameView) {
            case "common":
                return plant.commonName || `(${plant.scientificName})`;
            case "scientific":
                return plant.scientificName;
            default:
                throw new Error(`Unexpected name view: ${nameView}`);
        }
    }

    static flattenCompanionList(companions) {
        let companionLinks = [];
        for (let companion of companions) {
            for (let helpsTsn of companion.helps) {
                companionLinks.push({source: companion._id, target: helpsTsn, effect: "help"});
            }

            for (let hindersTsn of companion.hinders) {
                companionLinks.push({source: companion._id, target: hindersTsn, effect: "hinder"});
            }
        }

        return companionLinks;
    }

    static getRelevantTsns(links) {
        let tsnLookup = {};
        for (let link of companionLinks) {
            tsnLookup[link.source] = true;
            tsnLookup[link.target] = true;
        }

        return Object.keys(tsnLookup);
    }

    static getParentAndChildTsns(tsns, hierarchyLinks) {
        let tsnLookup = tsnLookup;
        tsns.forEach(tsn => tsnLookup[tsn] = true);

        // Build parent/child lookups
        // childLookup:  {"<parentId>": {"<childId>": true, ...}, ...}
        // parentLookup: {"<childId>": <parentId>}
        let childLookup = {};
        let parentLookup = {};
        for (let link of hierarchyLinks) {
            childLookup[link.parentId] = childLookup[link.parentId] || {};
            childLookup[link.parentId][link._id] = true;

            parentLookup[link._id] = link.parentId;
        }

        // Recursively add the parents and children of all TSNs
        let addParentTsns = tsn => {
            let parentTsn = Number.parseInt(parentLookup[tsn]);
            if (!Number.isNaN(parentTsn)) {
                tsnLookup[parentTsn] = true;
                addParentTsns(parentTsn);
            }
        };

        let addChildTsns = tsn => {
            let childTsns = childLookup[tsn];
            if (childTsns) {
                for (let childTsn in childTsns) {
                    tsnLookup[childTsn] = true;
                    addChildTsns(childTsn);
                }
            }
        }

        for (let tsn in tsnLookup) {
            addParentTsns(tsn);
            addChildTsns(tsn);
        }

        return Object.keys(tsnLookup);
    }

    static getReferenceLookup (helpReferences, hinderReferences) {
        let referenceLookup = {};

        for (let reference of helpReferences.concat(hinderReferences)) {
            let [sourceTsn, targetTsn] = reference.key.split("-");
            referenceLookup[sourceTsn] = referenceLookup[sourceTsn] || {};
            referenceLookup[sourceTsn][targetTsn] = referenceLookup[sourceTsn][targetTsn] || [];
            referenceLookup[sourceTsn][targetTsn].push({
                type: reference.type.slice("companion-".length),
                url: reference.url,
                extract: reference.extract
            });
        }

        return referenceLookup;
    }

    static getLeafNodeCompanionLinks(companionLinks, hierarchyLinks, plantLookup) {

        let childLookup = {};
        for (let link of hierarchyLinks) {
            childLookup[link.parentId] = childLookup[link.parentId] || {};
            childLookup[link.parentId][link._id] = true;
        }

        // Move all original links from non-leaf nodes to leaf nodes
        let originalLinks = companionLinks;
        let linkLookup = {};
        let addlink = (link, originalLink, reference) => {
            let sourceChildren = childLookup[link.source];
            let targetChildren = childLookup[link.target];
            if (!sourceChildren && !targetChildren) {
                let targetLookup = linkLookup[link.source] = linkLookup[link.source] || {};
                let effectLookup = targetLookup[link.target] = targetLookup[link.target] || {};
                let details = effectLookup[originalLink.effect] = effectLookup[originalLink.effect] || [];
                details.push({
                    from: plantLookup[originalLink.source],
                    to: plantLookup[originalLink.target],
                    effect: originalLink.effect,
                    reference: reference
                });

                return;
            }

            if (!sourceChildren) {
                for (let targetChild in targetChildren) {
                    let childLink = {
                        source: link.source,
                        target: targetChild
                    };

                    addlink(childLink, originalLink, reference);
                }
            } else {
                for (let sourceChild in sourceChildren) {
                    let childLink = {
                        source: sourceChild,
                        target: link.target
                    };

                    addlink(childLink, originalLink, reference);
                }
            }
        }

        for (let link of originalLinks) {
            let reference = null; // TODO: reference
            addlink(link, link, reference);
        }

        let links = [];
        for (let source in linkLookup) {
            let targetLookup = linkLookup[source];
            for (let target in targetLookup) {
                let effectLookup = targetLookup[target];
                for (let effect in effectLookup) {
                    links.push({
                        source: plantLookup[source],
                        target: plantLookup[target],
                        effect: effect,
                        details: effectLookup[effect]
                    });
                }
            }
        }

        return links;
    }
}