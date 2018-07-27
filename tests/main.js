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

jasmine.loadConfigFile("config/surface.json");

const JasmineConsoleReporter = require('jasmine-console-reporter');
const reporter = new JasmineConsoleReporter({
    colors: 1,           // (0|false)|(1|true)|2
    cleanStack: 1,       // (0|false)|(1|true)|2|3
    verbosity: 4,        // (0|false)|1|2|(3|true)|4
    listStyle: 'indent', // "flat"|"indent"
    activity: true,
    emoji: true,         // boolean or emoji-map object
    beep: true
});
 
// initialize and execute
jasmine.env.clearReporters();
jasmine.addReporter(reporter);

jasmine.execute();


