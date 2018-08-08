"use strict";

var Limits = require('./limits'); 
var Responses = require('./responses'); 
var Wallet = require('./wallet'); 
var Token = require('./token'); 
var EOS = require('./emanate-eos');
var config = require('../scripts/server-config')

require('../scripts/environment');
var Common = {
    limits: Limits,
    responses: Responses,
    wallet: Wallet,
    token: Token,
    eos: EOS,
    config: config
};

module.exports = Common;
