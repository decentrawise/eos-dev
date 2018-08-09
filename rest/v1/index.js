"use strict";

var router = require('express').Router();
var jwt = require('jsonwebtoken');
var common = require('../common');

router.use('/api', require('./api'));
router.use('/authenticate', require('./authenticate'));
router.use('/debug', require('./debug'));



//  Verify authentication token
if( common.config.runMode != "Debug" ) {
    router.use(common.token.verify);
}


router.use('/user', require('./user'));
router.use('/collab', require('./collab'));

module.exports = router