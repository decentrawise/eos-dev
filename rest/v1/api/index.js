var router = require('express').Router();
var path = require('path');

router.get('/', function(req, res) {
    res.sendFile(path.join(__dirname, 'api.html'));
});

module.exports = router