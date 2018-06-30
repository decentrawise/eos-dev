var router = require('express').Router();
var common = require('../../../common');

var keys = [
    common.wallet.getKeyPair('emancollab').private,
    common.wallet.getKeyPair('emancontent').private,
    common.wallet.getKeyPair('user11').private,
    common.wallet.getKeyPair('user12').private,
    common.wallet.getKeyPair('user13').private,
    common.wallet.getKeyPair('user14').private,
    common.wallet.getKeyPair('user15').private,
    common.wallet.getKeyPair('user21').private,
    common.wallet.getKeyPair('user22').private,
    common.wallet.getKeyPair('user23').private,
    common.wallet.getKeyPair('user24').private,
    common.wallet.getKeyPair('user25').private,
    common.wallet.getKeyPair('testuser11').private,
    common.wallet.getKeyPair('testuser12').private,
    common.wallet.getKeyPair('testuser13').private,
    common.wallet.getKeyPair('testuser14').private,
    common.wallet.getKeyPair('testuser15').private,
    common.wallet.getKeyPair('testuser21').private,
    common.wallet.getKeyPair('testuser22').private,
    common.wallet.getKeyPair('testuser23').private,
    common.wallet.getKeyPair('testuser24').private,
    common.wallet.getKeyPair('testuser25').private,
];

router.get('/', common.limits.getData, (req, res) => {
    var eos = common.eos.instance(common.eos.getEOSConfig(keys));

    eos.getTableRows(true, 'emancontent', req.username, 'track').then(results => {
        results.rows.forEach(track => {
            track.metadata = JSON.parse( track.metadata );
        });
        
        res.send(common.responses.ok(results));
    }).catch(error => {
        res.send(common.responses.error(error));
    });
})

router.post('/', common.limits.addData, (req, res) => {
    var eos = common.eos.instance(common.eos.getEOSConfig(keys));
    var data = req.body;
    const options = common.eos.callOptions(["emancontent"], [common.eos.permissions("emancontent")]);

    eos.contract('emancontent', options).then(contract => {
        contract.addtrack(req.username, data.parameters.title, JSON.stringify(data.parameters.metadata)).then(function() {
            res.send(common.responses.ok());
        }).catch(error => {
            res.send(common.responses.error(error));
        });
    }).catch(error => {
        res.send(common.responses.error(error));
    });
})

router.delete('/', common.limits.changeData, (req, res) => {
    var eos = common.eos.instance(common.eos.getEOSConfig(keys));
    var data = req.body;
    const options = common.eos.callOptions(["emancontent"], [common.eos.permissions("emancontent")]);

    eos.contract('emancontent', options).then(contract => {
        contract.removetrack(req.username, data.parameters.title).then(function() {
            res.send(common.responses.ok());
        }).catch(error => {
            res.send(common.responses.error(error));
        });
    }).catch(error => {
        res.send(common.responses.error(error));
    });
})

router.get('/statistics', common.limits.getData, (req, res) => {
    var eos = common.eos.instance(common.eos.getEOSConfig(keys));
    eos.getTableRows(true, 'emancontent', req.username, 'stat').then(results => {
        res.send(common.responses.ok(results));
    }).catch(error => {
        res.send(common.responses.error(error));
    });
})

module.exports = router