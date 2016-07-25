// Karma configuration
// Generated on Fri Jul 22 2016 16:10:32 GMT+1200 (New Zealand Standard Time)

module.exports = function(config) {
    config.set({

        // base path that will be used to resolve all patterns (eg. files, exclude)
        basePath: '',

        // frameworks to use
        // available frameworks: https://npmjs.org/browse/keyword/karma-adapter
        frameworks: ['jspm', 'jasmine'],

        // Path issues, see: https://github.com/Workiva/karma-jspm/issues/91
        jspm: {
            loadFiles: ['test/unit/setup.js', 'test/unit/**/!(setup).js'],
            serveFiles: ['src/**/*.*'],
            paths: {
                '*': 'src/*',
                'test/*': 'test/*',
                'github:*': 'jspm_packages/github/*',
                'npm:*': 'jspm_packages/npm/*'
            }
        },

        // list of files / patterns to load in the browser
        files: [],

        // list of files to exclude
        exclude: [],

        // preprocess matching files before serving them to the browser
        // available preprocessors: https://npmjs.org/browse/keyword/karma-preprocessor
        preprocessors: {
            'test/**/*.js': ['babel'],
            'src/**/*.js': ['babel']
        },

        babelPreprocessor: {
            options: {
                sourceMap: 'inline',
                presets: [ 'es2015-loose', 'stage-1' ],
                plugins: [
                    'syntax-flow',
                    'transform-decorators-legacy',
                    'transform-flow-strip-types',
//                    "transform-async-to-generator",
//                    "syntax-flow",
//                    "transform-flow-strip-types",
//                    // https://github.com/babel/gulp-babel/issues/90
                    //"transform-es2015-modules-systemjs"
                ]
            }
        },

        // test results reporter to use
        // possible values: 'dots', 'progress'
        // available reporters: https://npmjs.org/browse/keyword/karma-reporter
        reporters: ['progress'],

        // web server port
        port: 9876,

        // enable / disable colors in the output (reporters and logs)
        colors: true,

        // level of logging
        // possible values: config.LOG_DISABLE || config.LOG_ERROR || config.LOG_WARN || config.LOG_INFO || config.LOG_DEBUG
        logLevel: config.LOG_INFO,

        // enable / disable watching file and executing tests whenever any file changes
        autoWatch: true,

        // start these browsers
        // available browser launchers: https://npmjs.org/browse/keyword/karma-launcher
        browsers: ['Chrome'],

        // Continuous Integration mode
        // if true, Karma captures browsers, runs the tests and exits
        singleRun: false,

        // Concurrency level
        // how many browser should be started simultaneous
        concurrency: Infinity
    })
}
