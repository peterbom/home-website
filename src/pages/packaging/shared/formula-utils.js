export function replacePlaceholdersWithVariables(formulaText, variables) {
	let placeholderRegex = /{(\d+)}/;
	let result = formulaText;
	let match;
	while (match = result.match(placeholderRegex)) {
		let placeholder = match[0];
		let variableIndex = Number.parseInt(match[1]);
		let variable = variables.find(v => v.variableIndex === variableIndex);
		result = result.replace(placeholder, variable.variableIdentifier);
	}

	return result;
}