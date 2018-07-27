"use strict";

var RateLimit = require('express-rate-limit');
var responses = require('./responses');

var Limits = {
    addData: new RateLimit({
        windowMs: 60*60*1000,       // 60 minutes
        max: 20,                     // limit each API KEY to 1 requests per windowMs
        delayMs: 0,                 // disable delaying - full speed until the max limit is reached
        headers: true,              // enable rate limit headers
        handler: function (req, res, next) {
            res.format({
                json: function(){
                    res.json(responses.error({name: 'LimitError', message:'You reached your quota for adding data'}));
                }
            });
        }
    }),
    changeData: new RateLimit({
        windowMs: 60*60*1000,       // 60 minutes
        max: 50,                     // limit each API KEY to 1 requests per windowMs
        delayMs: 0,                 // disable delaying - full speed until the max limit is reached
        headers: true,              // enable rate limit headers
        handler: function (req, res, next) {
            res.format({
                json: function(){
                    res.json(responses.error({name: 'LimitError', message:'You reached your quota for changing data'}));
                }
            });
        }
    }),
    getData: new RateLimit({
        windowMs: 10000,             // 1 minute
        max: 100,                    // limit each API KEY to 10 requests per windowMs
        delayMs: 0,                 // disable delaying - full speed until the max limit is reached
        headers: true,              // enable rate limit headers
        handler: function (req, res, next) {
            res.format({
                json: function(){
                    res.json(responses.error({name: 'LimitError', message:'You reached your quota for getting data'}));
                }
            });
        }
    })
};

module.exports = Limits;