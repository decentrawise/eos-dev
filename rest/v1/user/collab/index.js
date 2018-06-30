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

    eos.getTableRows(true, 'emancollab', req.username, 'proposal').then(results => {
        res.send(common.responses.ok(results));
    }).catch(error => {
        res.send(common.responses.error(error));
    });
})

router.post('/', common.limits.addData, (req, res) => {
    var eos = common.eos.instance(common.eos.getEOSConfig(keys));
    const options = common.eos.callOptions(["emancollab"], [common.eos.permissions("emancollab"), common.eos.permissions(req.username)]);
    var data = req.body;

    data.parameters.proposer = req.username;    //  Complete the parameter data json for eos

    eos.contract('emancollab', options).then(contract => {
        contract.propose(data.parameters).then(function() { 
            res.send(common.responses.ok()); 
        }).catch(error => {
            res.send(common.responses.error(error));
        });
    }).catch(error => {
        res.send(common.responses.error(error));
    });
})

router.delete('/:contract', common.limits.changeData, (req, res) => {
    var eos = common.eos.instance(common.eos.getEOSConfig(keys));
    var data = req.body;
    const options = common.eos.callOptions(["emancontent"], [common.eos.permissions("emancontent")]);

    var parameters = {
        proposer: req.username,
        proposal_name: req.params.contract,
        canceler: req.username
    };

    eos.contract('emancollab', options).then(contract => {
        contract.cancel(parameters, { authorization: req.username }).then(function() {
            res.send(common.responses.ok());
        }).catch(error => {
            res.send(common.responses.error(error));
        });
    }).catch(error => {
        res.send(common.responses.error(error));
    });
})

router.put('/accept', common.limits.changeData, (req, res) => {
    var data = req.body;

    var eos = common.eos.instance(common.eos.getEOSConfig(keys));
    const options = common.eos.callOptions(["emancollab"], [common.eos.permissions("emancollab")]);

    data.parameters.approver = req.username;    //  Complete the parameter data json for eos
    
    eos.contract('emancollab', options).then(contract => {
        contract.approve(data.parameters.proposer, data.parameters.proposal_name, data.parameters.approver, { authorization: req.username }).then(function() {
            res.json(common.responses.ok());
        }).catch(error => {
            res.json(common.responses.error(error));
        });
    }).catch(error => {
        res.json(common.responses.error(error));
    });
    
})

router.put('/reject', common.limits.changeData, (req, res) => {
    var data = req.body;

    var eos = common.eos.instance(common.eos.getEOSConfig(keys));
    const options = common.eos.callOptions(["emancollab"], [common.eos.permissions("emancollab")]);

    data.parameters.unapprover = req.username;    //  Complete the parameter data json for eos

    eos.contract('emancollab', options).then(contract => {
        contract.unapprove(data.parameters.proposer, data.parameters.proposal_name, data.parameters.unapprover, { authorization: req.username }).then(function() { 
            res.send(common.responses.ok());
        }).catch(error => {
            res.send(common.responses.error(error));
        });
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