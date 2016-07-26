const base = require("./base");

module.exports = function(config) {
	base(config);

	config.set({
		autoWatch: false,
		singleRun: true
	});
};