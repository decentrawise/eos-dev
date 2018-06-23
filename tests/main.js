"use strict";

var Jasmine = require("jasmine");
var jasmine = new Jasmine();
// jasmine.exit = function(exitCode) { process.exitCode = exitCode; };
// 
// jasmine.env.clearReporters();
// 
// const MgaReporter = require("./lib/reporter");
// jasmine.env.addReporter(new MgaReporter());
// 
// if (mga.config.storeTestResults === true) {
//     const DbReporter = require("./lib/dbreporter");
//     jasmine.env.addReporter(new DbReporter());
// }

// jasmine.loadConfigFile("spec/support/reset-config.json");

// const matchers = require("jasmine-expect");
jasmine.execute();


