var router = require('express').Router();
var jwt = require('jsonwebtoken');
var common = require('../common');

router.use('/api', require('./api'));
router.use('/authenticate', require('./authenticate'));
router.use('/debug', require('./debug'));


//  Verify authentication token
router.use(common.token.verify);


router.use('/user', require('./user'));

module.exports = router