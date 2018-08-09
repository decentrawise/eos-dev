"use strict";

var router = require('express').Router();
var common = require('../../../common');
var crypto = require("crypto");
var util = require("util");

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
    if(hash.toString(10).length < 10) {
        return hash;
    }
    hash = Buffer(hash).toString('hex');
    return parseInt(hash.substring(hash.length - 8), 16);
}
/*
function assetTableParams(userName, lowerBound = 0, maxRows = 0){
    return common.eos.tableParams('emancontent', userName, 'soundasset', 'id', lowerBound, maxRows);
}
*/
router.get('/', common.limits.getData, (req, res) => {
    var eos = common.eos.instance(common.eos.getEOSConfig(keys));

    var result = eos.getAllTableRows(common.eos.assetTableParams(req.username), result => {
        result.forEach(track => {
            track.metadata = JSON.parse( track.metadata );
        });
        res.json(common.responses.ok(result));
    });
})

router.get('/:hash', common.limits.getData, (req, res) => {
    var eos = common.eos.instance(common.eos.getEOSConfig(keys));

    var result64 = generateId64(req.params.hash);

    eos.getFirstRecord(common.eos.assetTableParams(req.username, result64)).then(result => {
        result.metadata = JSON.parse( result.metadata );
        res.json(common.responses.ok(result));
    });
})

var multer  = require('multer');
var upload = multer({ dest: "path" })
var fs = require("fs");

router.post('/', common.limits.addData, upload.single("asset"), (req, res) => {
    var eos = common.eos.instance(common.eos.getEOSConfig(keys));
    var metadata = JSON.parse(req.body.metadata);
    const options = common.eos.callOptions(["emancontent"], [common.eos.permissions("emancontent")]);
    console.log("add asset - step 0");
    let ipfs = require('ipfs-api')(common.config.ipfs);
    console.log("add asset - step 0.1");
    var id64 = 0;

    console.log("File path: " + req.file.path);
    fs.readFile(req.file.path, (err, data) => {
        console.log("add asset - step 1");
        return ipfs.files.add(Buffer.from(data)).then((result) => {
            console.log("add asset - step 2");
            id64 = generateId64(result[0].hash);
            console.log("add asset - step 2.1");
            if(id64 == 0) {
                throw {message: 'id64 can not be 0'};
            }

            metadata.path = result[0].path;           //  Path in ipfs
            metadata.hash = result[0].hash;           //  File hash in ipfs
            metadata.size = result[0].size;           //  File size
            metadata.lengthMs = 100000;     //  To be set properly with the asset length in miliseconds;
            metadata.owner = req.username;  //  Owner/poster of this asset
            return eos.contract('emancontent', options);
        }).then(contract => {
            console.log("add asset - step 3");
            return contract.addtrack(req.username, id64, JSON.stringify(metadata));
        }).then(function() {
            console.log("add asset - step 4");
            return eos.getFirstRecord(common.eos.assetTableParams(req.username, id64));
        }).then(result => {
            console.log("add asset - step 5");
            result.metadata = JSON.parse( result.metadata );
            res.json(common.responses.ok(result));
        }).catch(error => {
            console.log("Add asset [catch] - " + error.message);
            res.json(common.responses.error(error));
        });
    });
})

router.put('/:hash', common.limits.changeData, (req, res) => {
    var eos = common.eos.instance(common.eos.getEOSConfig(keys));
    var id64 = generateId64(req.params.hash);

    eos.contract('emancontent', options).then(contract => {
        return contract.updatetrack(req.username, id64, JSON.stringify(data.parameters.metadata));
    }).then(function() {
        return eos.getFirstRecord(common.eos.assetTableParams(req.username, id64));
    }).then(result => {
        result.metadata = JSON.parse( result.metadata );
        res.json(common.responses.ok(result));
    }).catch(error => {
        res.json(common.responses.error(error));
    });
})

router.delete('/:hash', common.limits.changeData, (req, res) => {
    var eos = common.eos.instance(common.eos.getEOSConfig(keys));
    const options = common.eos.callOptions(["emancontent"], [common.eos.permissions("emancontent")]);
    var id64 = generateId64(req.params.hash);
    var contract = null;
    var returnValue = null;

    eos.contract('emancontent', options).then(result => {
        contract = result;
        return eos.getFirstRecord(common.eos.assetTableParams(req.username, id64));
    }).then(result => {
        returnValue = result;
        return contract.removetrack(req.username, id64);
    }).then(() => {
        returnValue.metadata = JSON.parse( returnValue.metadata );
        res.json(common.responses.ok(returnValue));
    }).catch(error => {
        console.log("asset delete [catch]: " + error.message);
        res.json(common.responses.error(error));
    });
})

router.get('/statistics/:hash', common.limits.getData, (req, res) => {
    var eos = common.eos.instance(common.eos.getEOSConfig(keys));

    var id64 = generateId64(req.params.hash);

    eos.getFirstRecord(common.eos.assetTableParams(req.username, id64)).then(result => {
        res.json(common.responses.ok({totalSecondsPlayed: result.totalSecondsPlayed, totalTimesPlayed: result.totalTimesPlayed}));
    });
})

router.put('/play/:user/:hash', common.limits.changeData, (req, res) => {
    var eos = common.eos.instance(common.eos.getEOSConfig(keys));
    const options1 = common.eos.callOptions(["emancollab"], [common.eos.permissions("emancollab"), common.eos.permissions(req.username)]);
    const options2 = common.eos.callOptions(["emancontent"], [common.eos.permissions("emancontent"), common.eos.permissions(req.username)]);

    var id64 = generateId64(req.params.hash);
    var assetContract = null;
    var collabContract = null;
    var asset = null;

    eos.getFirstRecord(common.eos.assetTableParams(req.params.user, id64)).then(result => {
        if(result == null) {
            throw {message: 'Asset not found'};
        }
        
        asset = result;
        asset.metadata = JSON.parse(asset.metadata);

        return Promise.all([
            eos.contract('emancollab', options1),
            eos.contract('emancontent', options2)
        ]);
    }).then(result => {
        collabContract = result[0];
        assetContract = result[1];

        return Promise.all([
            assetContract.startplaying(req.params.user, id64),
            collabContract.exec(asset.metadata.contract.proposer, asset.metadata.contract.proposal_name, req.username, 60, { authorization: req.username })
        ]);
    }).then(() => {
        res.json(common.responses.ok());
    }).catch(error => {
        console.log(error.message);
        res.json(common.responses.error(error.message));
    });
})


module.exports = router