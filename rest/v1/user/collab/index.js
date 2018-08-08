"use strict";

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

function generateId64(hash) {
    if(hash.toString(10).length < 10) {
        return hash;
    }
    hash = Buffer(hash).toString('hex');
    return parseInt(hash.substring(hash.length - 8), 16);
}


router.get('/', common.limits.getData, (req, res) => {
    var params = common.eos.collabTableParams(req.username);
    var eos = common.eos.instance(common.eos.getEOSConfig(keys));
    var result = eos.getAllTableRows(params, result => {
        res.json(common.responses.ok(result));
    });
})

router.get('/:contract', common.limits.getData, (req, res) => {
    var eos = common.eos.instance(common.eos.getEOSConfig(keys));

    eos.getFirstRecord(common.eos.collabTableParams(req.username, req.params.contract)).then(result => {
        if(result) {
            res.json(common.responses.ok(result));
        } else {
            res.json(common.responses.error('Not found'));
        }
    });
})

router.post('/', common.limits.addData, (req, res) => {
    var eos = common.eos.instance(common.eos.getEOSConfig(keys));
    const options1 = common.eos.callOptions(["emancollab"], [common.eos.permissions("emancollab"), common.eos.permissions(req.username)]);
    const options2 = common.eos.callOptions(["emancontent"], [common.eos.permissions("emancontent"), common.eos.permissions(req.username)]);
    var data = req.body;
    var collabContract = null;
    var assetContract = null;
    var id64 = 0;

    if(data.parameters.fileHash != "") {
        id64 = generateId64(data.parameters.fileHash);
    }

    data.parameters.proposer = req.username;    //  Complete the parameter data json for eos

    Promise.all([
        eos.contract('emancollab', options1),
        eos.contract('emancontent', options2)
    ]).then(result => {
        collabContract = result[0];
        assetContract = result[1];

        return eos.getFirstRecord(common.eos.assetTableParams(req.username, id64));
    }).then(result => { 
        var promises = [
            collabContract.propose(data.parameters)
        ];

        if(result) {
            result.metadata = JSON.parse(result.metadata);
            result.metadata.contract = {proposer: req.username, proposal_name: data.parameters.proposal_name};
            promises.push(assetContract.updatetrack(req.username, id64, JSON.stringify(result.metadata)));
        }

        return Promise.all(promises);
    }).then(() => { 
        var promises = [
            eos.getFirstRecord(common.eos.collabTableParams(req.username, data.parameters.proposal_name)),
            eos.getFirstRecord(common.eos.assetTableParams(req.username, id64))
        ];

        return Promise.all(promises);
    }).then(result => {
        var returnValue = {collab: result[0]};

        if(id64 > 0) {
            result[1].metadata = JSON.parse(result[1].metadata);
            returnValue.asset = result[1];
        }
        res.send(common.responses.ok(returnValue));
    }).catch(error => {
        console.log("contract propose - catch -> " + error);
        res.send(common.responses.error(error));
    });
})

router.put('/:contract/:hash', common.limits.changeData, (req, res) => {
    var eos = common.eos.instance(common.eos.getEOSConfig(keys));
    const options1 = common.eos.callOptions(["emancollab"], [common.eos.permissions("emancollab"), common.eos.permissions(req.username)]);
    const options2 = common.eos.callOptions(["emancontent"], [common.eos.permissions("emancontent"), common.eos.permissions(req.username)]);


    var parameters = {
        proposer: req.username,
        proposal_name: req.params.contract,
        fileHash: req.params.hash
    };
    var collabContract = null;
    var assetContract = null;
    var collabRecord = null;
    var currentFileId = 0;
    var newFileId64 = generateId64(req.params.hash);
    
    Promise.all([
        eos.contract('emancollab', options1),
        eos.contract('emancontent', options2),
        eos.getFirstRecord(common.eos.collabTableParams(req.username, req.params.contract)),
    ])
    .then(result => {
        collabContract = result[0];
        assetContract = result[1];
        collabRecord = result[2];

        var promises = [
            eos.getFirstRecord(common.eos.assetTableParams(req.username, newFileId64))
        ];


        if( collabRecord.fileHash ) {
            currentFileId = generateId64(collabRecord.fileHash);
            promises.push(eos.getFirstRecord(common.eos.assetTableParams(req.username, currentFileId)));
        }

        return Promise.all(promises);
    }).then(result => {
        var newFileMetadata = JSON.parse(result[0].metadata);
        
        newFileMetadata.contract = {proposer: req.username, proposal_name: req.params.contract};

        var promises = [
            collabContract.updatehash(parameters),
            assetContract.updatetrack(req.username, newFileId64, JSON.stringify(newFileMetadata))
        ];
        
        if( currentFileId ) {
            var currentFileMetadata = JSON.parse(result[1].metadata);
            delete currentFileMetadata.contract;
            promises.push(assetContract.updatetrack(req.username, currentFileId, JSON.stringify(currentFileMetadata)));
        }
        
        return Promise.all(promises);
    }).then(result => {
        var promises = [
            eos.getFirstRecord(common.eos.collabTableParams(req.username, req.params.contract)),
            eos.getFirstRecord(common.eos.assetTableParams(req.username, newFileId64))
        ];

        if( currentFileId ) {
            promises.push(eos.getFirstRecord(common.eos.assetTableParams(req.username, currentFileId)));
        }
        
        return Promise.all(promises);
    }).then(result => {
        var returnValue = {collab: result[0], asset1: result[1]};

        if( currentFileId ) {
            returnValue.asset2 = result[2];
        }

        res.send(common.responses.ok(returnValue));
    }).catch(error => {
        console.log("contract propose - catch - " + error.message);
        res.send(common.responses.error(error.message));
    });
})

router.delete('/:contract', common.limits.changeData, (req, res) => {
    var eos = common.eos.instance(common.eos.getEOSConfig(keys));
    var data = req.body;
    const options = common.eos.callOptions(["emancollab"], [common.eos.permissions("emancollab")]);
    var collabContract = null;
    var assetContract = null;
    var returnValue = null;
    var collabRecord = null;
    var assetRecord = null;

    Promise.all([
        eos.contract('emancollab', common.eos.callOptions(["emancollab"], [common.eos.permissions("emancollab")])),
        eos.contract('emancontent', common.eos.callOptions(["emancontent"], [common.eos.permissions("emancontent")]))
    ]).then(result => {
        collabContract = result[0];
        assetContract = result[1];
        return eos.getFirstRecord(common.eos.collabTableParams(req.username, req.params.contract));
    }).then(result => {
        if(result == null) {
            throw {message: 'Contract not found: ' + req.params.contract};
        }
        collabRecord = result;

        return eos.getFirstRecord(common.eos.assetTableParams(req.username, generateId64(result.fileHash)));
    }).then(result => {
        assetRecord = result;

        var parameters = {
            proposer: req.username,
            proposal_name: req.params.contract,
            canceler: req.username
        };

        var promises = [collabContract.cancel(parameters, { authorization: req.username })];

        if(assetRecord != null) {
            assetRecord.metadata = JSON.parse(assetRecord.metadata);
            delete assetRecord.metadata.contract;
            promises.push(assetContract.updatetrack(req.username, assetRecord.id, JSON.stringify(assetRecord.metadata)));
            
        }

        return Promise.all(promises);
    }).then(function() {
        res.send(common.responses.ok(collabRecord));
    }).catch(error => {
        console.log(error);
        res.send(common.responses.error(error));
    });
})

router.put('/accept', common.limits.changeData, (req, res) => {
    var data = req.body;

    var eos = common.eos.instance(common.eos.getEOSConfig(keys));
    const options = common.eos.callOptions(["emancollab"], [common.eos.permissions("emancollab")]);
    var contract = null;
    data.parameters.approver = req.username;    //  Complete the parameter data json for eos
    
    eos.contract('emancollab', options).then(result => {
        contract = result;
        return contract.approve(data.parameters.proposer, data.parameters.proposal_name, data.parameters.approver, { authorization: req.username });
    }).then(() => {
        return eos.getFirstRecord(common.eos.collabTableParams(data.parameters.proposer, data.parameters.proposal_name));
    }).then(result => {
        res.json(common.responses.ok(result));
    }).catch(error => {
        res.json(common.responses.error(error));
    });
    
})

router.put('/reject', common.limits.changeData, (req, res) => {
    var data = req.body;

    var eos = common.eos.instance(common.eos.getEOSConfig(keys));
    const options = common.eos.callOptions(["emancollab"], [common.eos.permissions("emancollab")]);
    var contract = null;
    data.parameters.unapprover = req.username;    //  Complete the parameter data json for eos

    eos.contract('emancollab', options).then(result => {
        contract = result;
        return contract.unapprove(data.parameters.proposer, data.parameters.proposal_name, data.parameters.unapprover, { authorization: req.username });
    }).then(function() { 
        return eos.getFirstRecord(common.eos.collabTableParams(data.parameters.proposer, data.parameters.proposal_name));
    }).then(result => {
        res.json(common.responses.ok(result));
    }).catch(error => {
        res.send(common.responses.error(error));
    });
})

router.post('/execute', common.limits.changeData, (req, res) => {
    var data = req.body;

    var eos = common.eos.instance(common.eos.getEOSConfig(keys));
    const options = common.eos.callOptions(["emancollab"], [common.eos.permissions("emancollab")]);

    eos.contract('emancollab', options).then(contract => {
        contract.exec(data.parameters.proposer, data.parameters.proposal_name, req.username, data.parameters.seconds, { authorization: req.username }).then(function() { 
            res.send(common.responses.ok());
        }).catch(error => {
            res.send(common.responses.error(error));
        });
    }).catch(error => {
        res.send(common.responses.error(error));
    });
})


module.exports = router
