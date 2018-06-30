var router = require('express').Router();
var common = require('../../common');

router.use('/:username', (req, res, next) => { 
    req.username = req.params.username;
    next();
});

router.get('/:username', common.limits.getData, (req, res) => {
    //  TODO: get user data
    res.send(common.responses.ok({ username: req.params.username }));
});

router.use('/:username/asset', require('./asset'));
router.use('/:username/collab', require('./collab'));

module.exports = router