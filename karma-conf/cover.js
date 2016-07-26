const base = require("./base");

module.exports = function(config) {
	base(config);

	config.set({
        preprocessors: {
            'test/**/*.js': ['babel'],
            'src/**/*.js': ['babel', 'coverage']
        },
		reporters: ['coverage'],
		coverageReporter: {
			includeAllSources: true,
			instrumenters: {
				isparta: require('isparta')
			},
			instrumenter: {
				'src/**/*.js': 'isparta'
			},
			reporters: [
				{ type: 'html', dir: 'coverage' },
				{ type: 'text' }
			]
		},
		autoWatch: false,
		singleRun: true
	});

	return;
};