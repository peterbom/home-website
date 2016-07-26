const base = require("./base");

module.exports = function(config) {
	base(config);

	config.set({
		autoWatch: true,
		singleRun: false
	});
};