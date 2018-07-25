"use strict";

var router = require('express').Router();
var common = require('../../../common');
var crypto = require("crypto");

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

function generateId64(hash) {
    return parseInt(hash.substring(0, 8), 16);
}

function assetTableParams(userName, lowerBound = 0, maxRows = 0){
    return common.eos.tableParams('emancontent', userName, 'soundasset', 'id', lowerBound, maxRows);
}

router.get('/', common.limits.getData, (req, res) => {
    var eos = common.eos.instance(common.eos.getEOSConfig(keys));

    var result = eos.getAllTableRows(assetTableParams(req.username), result => {
        result.forEach(track => {
            track.metadata = JSON.parse( track.metadata );
        });
        res.json(common.responses.ok(result));
    });
})

router.get('/:hash', common.limits.getData, (req, res) => {
    var eos = common.eos.instance(common.eos.getEOSConfig(keys));

    var result64 = generateId64(req.params.hash);

    var result = eos.getFirstRecord(assetTableParams(req.username, result64), result => {
        result.metadata = JSON.parse( result.metadata );
        res.json(common.responses.ok(result));
    });
})

router.post('/', common.limits.addData, (req, res) => {
    var eos = common.eos.instance(common.eos.getEOSConfig(keys));
    var data = req.body;
    const options = common.eos.callOptions(["emancontent"], [common.eos.permissions("emancontent")]);

    const hash = crypto.createHash('sha256').update(data.parameters.metadata.title).digest('hex');
    var id64 = generateId64(hash);

    data.parameters.metadata.hash = hash;       //  TODO: set hash from ipfs
    data.parameters.metadata.lengthMs = 100000; //  To be set properly with the asset length in miliseconds;

    eos.contract('emancontent', options).then(contract => {
        return contract.addtrack(req.username, id64, JSON.stringify(data.parameters.metadata));
    }).then(function() {
        eos.getFirstRecord(assetTableParams(req.username, id64), result => {
            result.metadata = JSON.parse( result.metadata );
            res.json(common.responses.ok(result));
        });
    }).catch(error => {
        res.json(common.responses.error(error));
    });
})

router.delete('/:hash', common.limits.changeData, (req, res) => {
    var eos = common.eos.instance(common.eos.getEOSConfig(keys));
    const options = common.eos.callOptions(["emancontent"], [common.eos.permissions("emancontent")]);

    var id64 = generateId64(req.params.hash);
    console.log(id64);

    eos.contract('emancontent', options).then(contract => {
        eos.getFirstRecord(assetTableParams(req.username, id64), result => {
            contract.removetrack(req.username, id64).then(function() {
                result.metadata = JSON.parse( result.metadata );
                res.json(common.responses.ok(result));
            }).catch(error => {
                res.json(common.responses.error(error));
            });
        });
    }).catch(error => {
        res.json(common.responses.error(error));
    });
})

router.get('/statistics/:hash', common.limits.getData, (req, res) => {
    var eos = common.eos.instance(common.eos.getEOSConfig(keys));

    var id64 = generateId64(req.params.hash);

    var result = eos.getFirstRecord(statsTableParams(req.username, id64), result => {
        res.json(common.responses.ok({totalSecondsPlayed: result.totalSecondsPlayed, totalTimesPlayed: result.totalTimesPlayed}));
    });
})

router.put('/play/:hash', common.limits.changeData, (req, res) => {
    var eos = common.eos.instance(common.eos.getEOSConfig(keys));
    const options = common.eos.callOptions(["emancontent"], [common.eos.permissions("emancontent")]);

    var id64 = generateId64(req.params.hash);

    //  TODO: Execute the collaboration contract if it exists in the metadata
    eos.contract('emancontent', options).then(contract => {
        return contract.startplaying(req.username, id64);
    }).then(function() {
        res.json(common.responses.ok());
    }).catch(error => {
        res.json(common.responses.error(error));
    });
})


module.exports = router