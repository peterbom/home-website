// this file provides a list of unbundled files that
// need to be included when exporting the application
// for production.
module.exports = {
    exportPath: "export",
    list: [
        'index.html',
        'config.js',
        'favicon.ico',
        'jspm_packages/system.js',
        'jspm_packages/system-polyfills.js',
        'jspm_packages/system-csp-production.js',
        'dist/styles.css'
    ],
    // this section lists any jspm packages that have
    // unbundled resources that need to be exported.
    // these files are in versioned folders and thus
    // must be 'normalized' by jspm to get the proper
    // path.
    normalize: [
        [
            // include font-awesome.css and its fonts files
            'font-awesome', [
                '/css/font-awesome.min.css',
                '/fonts/*'
            ]
        ], [
            // include bootstrap's font files
            'bootstrap', [
                '/fonts/*'
            ]
        ], [
            'bluebird', [
                '/js/browser/bluebird.min.js'
            ]
        ], [
            'jquery-datetimepicker', [
                '/build/jquery.datetimepicker.min.css'
            ]
        ], [
            'select2', [
                '/css/select2.min.css'
            ]
        ], [
            'select2-bootstrap-theme', [
                '/dist/select2-bootstrap.min.css'
            ]
        ]
    ]
};
