var bundler = require('aurelia-bundler');

var config = {
  force: true,
  baseURL: 'public',                   // baseURL of the application
  configPath: 'public/config.js',      // config.js file. Must be within `baseURL`
  bundles: {
    "dist/app-build": {           // bundle name/path. Must be within `baseURL`. Final path is: `baseURL/dist/app-build.js`.
      includes: [
        '[*.js]',
        '*.html!text',
        '*.css!text',        
      ],
      options: {
        inject: true,
        minify: true
      }
    },
    "dist/vendor-build": {
      includes: [
        'aurelia-bootstrapper',
        'aurelia-fetch-client',
        'aurelia-router',
        'aurelia-animator-css',
        'github:aurelia/templating-binding',
        'github:aurelia/templating-resources',
        'github:aurelia/templating-router',
        'github:aurelia/loader-default',
        'github:aurelia/history-browser',
        'github:aurelia/logging-console',
        'bootstrap/css/bootstrap.css!text'
      ],
      options: {
        inject: true,
        minify: true
      }
    }
  }
};

/*
function delay(time) {
  return new Promise(function (fulfill) {
    setTimeout(fulfill, time);
  });
}

console.log("hello");
delay(1000).then(function () {
  console.log("delayed 1000");
  return delay(1000);
}).then(function () {
  console.log("delayed 2000");
  return delay(1000);
}).then(function () {
  console.log("delayed 3000");
  return delay(1000);
}).then(function () {
  console.log("delayed 4000");
  return delay(1000);
}).then(function () {
  console.log("finished");
});
*/

var operation = process.argv[2];
switch (operation) {
  case "bundle":
    return bundler.bundle(config);
  case "unbundle":
    return bundler.unbundle(config);
  default:
    process.stderr.write("invalid argument: " + operation + "\n");
}

/*

gulp.task('bundle', ['build'], function() {
  return bundler.bundle(config);
});

gulp.task('unbundle', function() {
  return bundler.unbundle(config);
});


*/