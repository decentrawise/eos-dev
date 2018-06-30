var router = require('express').Router();
var common = require('../../common');

router.post('/', (req, res) => {
    var data = req.body;
    
    //if(data.user != data.password) {
    //    res.send(common.responses.error("Wrong user or password"));
    //    return;
    //}
    
    res.send(common.responses.ok({"token": common.token.create(data.user)}));
});

module.exports = router