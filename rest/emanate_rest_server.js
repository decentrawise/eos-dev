"use strict";

require('../scripts/environment.js');
var fs = require("fs");
var path = require('path');
var Eos = require('eosjs');
const express = require('express');
var cors = require('cors');
var bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
var RateLimit = require('express-rate-limit');


const app = express();

var port = 8585

app.use(bodyParser.json());
app.use(cors());

function getKeyPair(accountName, level) {

    var result = {};
    var walletPath = process.env.EOS_WALLET_INFO;
    
    if( level == null ) {
        level = 'active';
    }
    
    if( level == 'wallet' ) {
        var privateKeyFile = path.join(walletPath, accountName, 'wallet', 'private');
        if( fs.existsSync(privateKeyFile) == false ) {
            throw "Wallet was not created yet";
        }
        result.private = fs.readFileSync(privateKeyFile).toString();
    }
    else {
        var privateKeyFile = path.join(walletPath, accountName, level, 'private');
        var publicKeyFile = path.join(walletPath, accountName, level, 'public');
        
        result.private = fs.readFileSync(privateKeyFile).toString().trim();
        result.public = fs.readFileSync(publicKeyFile).toString().trim();
    }
    return result;
}

function eosCallOptions(scopes, permissions) {
    if( scopes == null ) {
        scopes = [];
    }
    
    if( permissions == null ) {
        permissions = [];
    }
    
    return {
        broadcast: true,
        sign: true,
        scope: scopes,
        authorization: permissions
    }
}

function resultOk(data) {
    if( data == null ) {
        data = {};
    }
    return { success: true, data: data };
}

function resultError(data) {
    if( data == null ) {
        data = {};
    }
    return { success: false, data: data };
}

function getEOSConfig() {
    return {
        httpEndpoint: 'http://localhost:8888',
        binaryen: require("binaryen"),
        keyProvider: [
            getKeyPair('emancollab').private,
            getKeyPair('emancontent').private,
            getKeyPair('user11').private,
            getKeyPair('user12').private,
            getKeyPair('user13').private,
            getKeyPair('user14').private,
            getKeyPair('user15').private,
            getKeyPair('user21').private,
            getKeyPair('user22').private,
            getKeyPair('user23').private,
            getKeyPair('user24').private,
            getKeyPair('user25').private,
            getKeyPair('testuser11').private,
            getKeyPair('testuser12').private,
            getKeyPair('testuser13').private,
            getKeyPair('testuser14').private,
            getKeyPair('testuser15').private,
            getKeyPair('testuser21').private,
            getKeyPair('testuser22').private,
            getKeyPair('testuser23').private,
            getKeyPair('testuser24').private,
            getKeyPair('testuser25').private,
        ],
        expireInSeconds: 60,
        broadcast: true,
        debug: false, // API and transactions
        sign: true,
        chainId: null // 32 byte (64 char) hex string        
    }
}

function permissions(user, level) {
    if (level == null) {
        level = 'active';
    }
    return {account: user, permission: level};
}

var Limits = {
    addData: new RateLimit({
        windowMs: 60*60*1000,       // 60 minutes
        max: 1,                     // limit each API KEY to 1 requests per windowMs
        delayMs: 0,                 // disable delaying - full speed until the max limit is reached
        headers: true,              // enable rate limit headers
        handler: function (req, res, next) {
            res.format({
                json: function(){
                    res.send(resultError({name: 'LimitError', message:'You reached your quota for adding data'}));
                }
            });
        }
    }),
    changeData: new RateLimit({
        windowMs: 60*60*1000,       // 60 minutes
        max: 1,                     // limit each API KEY to 1 requests per windowMs
        delayMs: 0,                 // disable delaying - full speed until the max limit is reached
        headers: true,              // enable rate limit headers
        handler: function (req, res, /*next*/) {
            res.format({
                json: function(){
                    res.send(resultError({name: 'LimitError', message:'You reached your quota for changing data'}));
                }
            });
        }
    }),
    getData: new RateLimit({
        windowMs: 1000,             // 1 minute
        max: 50,                    // limit each API KEY to 10 requests per windowMs
        delayMs: 0,                 // disable delaying - full speed until the max limit is reached
        headers: true,              // enable rate limit headers
        handler: function (req, res, /*next*/) {
            res.format({
                json: function(){
                    res.send(resultError({name: 'LimitError', message:'You reached your quota for getting data'}));
                }
            });
        }
    })
};

function verifyToken(res, data) {
    if(!("token" in data)) {
        res.send(resultError('You need to authenticate first'));
        return false;
    }
    
    var result = true;
    jwt.verify(data.token, getKeyPair('emancontent').private, (error, decoded) => {
        if(error) {
          res.send(resultError(error));
          result = false;
        }
    });
    
    return result;
}

const config = getEOSConfig();
var eos = Eos(config);

app.get('/', (req, res) => res.send('Welcome to the Emanate API<p><a href="/api">Documentation<a/>'))

app.get('/api', function(req, res) {
    res.sendFile(path.join(process.cwd(), 'api.html'));
});

app.post('/authenticate', (req, res) => {
    var data = req.body;
    
    if(data.user != data.password) {
        res.send(resultError("Wrong user or password"));
        return;
    }
    
    var token = jwt.sign({
          id: data.user,
        }, getKeyPair('emancontent').private, {
          expiresIn: 60
        });

    res.send(resultOk({"token": token}));
});

app.post('/propose', Limits.addData, (req, res) => {
    var data = req.body;
    
    if(!verifyToken(res, data)) {
        return;
    }

    const options = eosCallOptions(["emancollab"], [permissions("emancollab"), permissions(data.proposer)]);

    eos.contract('emancollab', options).then(contract => {
        contract.propose(data).then(function() { 
            res.send(resultOk()); 
        }).catch(error => {
            res.send(resultError(error));
        });
    }).catch(error => {
        res.send(resultError(error));
    });
})

app.post('/accept', Limits.changeData, (req, res) => {
    var data = req.body;
    const options = eosCallOptions(["emancollab"], [permissions("emancollab")]);

    if(!verifyToken(res, data)) {
        return;
    }

    eos.contract('emancollab', options).then(contract => {
        contract.approve(data.proposer, data.proposal_name, data.approver, { authorization: data.approver }).then(function() {
            res.send(resultOk());
        }).catch(error => {
            res.send(resultError(error));
        });
    }).catch(error => {
        res.send(resultError(error));
    });
    
})

app.post('/reject', Limits.addData, (req, res) => {
    var data = req.body;
    const options = eosCallOptions(["emancollab"], [permissions("emancollab")]);

    if(!verifyToken(res, data)) {
        return;
    }

    eos.contract('emancollab', options).then(contract => {
        contract.unapprove(data.proposer, data.name, data.from, { authorization: data.unapprover }).then(function() { 
            res.send(resultOk());
        }).catch(error => {
            res.send(resultError(error));
        });
    }).catch(error => {
        res.send(resultError(error));
    });
})

app.post('/cancel', Limits.changeData, (req, res) => {
    var data = req.body;
    const options = eosCallOptions(["emancollab"], [permissions("emancollab")]);

    if(!verifyToken(res, data)) {
        return;
    }

    eos.contract('emancollab', options).then(contract => {
        contract.cancel(data, { authorization: data.canceler }).then(function() {
            res.send(resultOk());
        }).catch(error => {
            res.send(resultError(error));
        });
    }).catch(error => {
        res.send(resultError(error));
    });
})

app.post('/execute', Limits.changeData, (req, res) => {
    var data = req.body;
    const options = eosCallOptions(["emancollab"], [permissions("emancollab")]);
    
    if(!verifyToken(res, data)) {
        return;
    }

    eos.contract('emancollab', options).then(contract => {
        contract.exec(data.proposer, data.name, data.from, { authorization: data.from }).then(function() { 
            res.send(resultOk());
        }).catch(error => {
            res.send(resultError(error));
        });
    }).catch(error => {
        res.send(resultError(error));
    });
})

app.post('/getContracts', Limits.getData, (req, res) => {
    var data = req.body;

    if(!verifyToken(res, data)) {
        return;
    }

    eos.getTableRows(true, 'emancollab', data.proposer, 'proposal').then(results => {
        res.send(resultOk(results));
    }).catch(error => {
        res.send(resultError(error));
    });
})

app.post('/getContract', Limits.getData, (req, res) => {
    var data = req.body;

    if(!verifyToken(res, data)) {
        return;
    }

    eos.getTableRows(true, 'emancollab', data.proposer, 'proposal').then(results => {
        //  TODO: Go through the results and find the proper contract from this user
        res.send(resultOk(results));
    }).catch(error => {
        res.send(resultError(error));
    });
})

app.post('/addTrack', Limits.addData, (req, res) => {
    var data = req.body;
    const options = eosCallOptions(["emancontent"], [permissions("emancontent")]);

    if(!verifyToken(res, data)) {
        return;
    }

    eos.contract('emancontent', options).then(contract => {
        contract.addtrack(data.owner, data.title, JSON.stringify(data.metadata)).then(function() {
            res.send(resultOk());
        }).catch(error => {
            res.send(resultError(error));
        });
    }).catch(error => {
        res.send(resultError(error));
    });
})

app.post('/getTrack', Limits.getData, (req, res) => {
    var data = req.body;

    if(!verifyToken(res, data)) {
        return;
    }

    var params = {
        json:true, 
        code: 'emancontent',
        scope: data.owner,
        table: 'track',
        table_key: 'id',
//         limit: 1,
        lower_bound: '0',
//         upper_bound: '2'
    }
    
    eos.getTableRows(params).then(results => {
        results.rows.forEach(track => {
            track.metadata = JSON.parse( track.metadata );
        });
        
        res.send(resultOk(results));
    }).catch(error => {
        res.send(resultError(error));
    });
})

app.post('/getTracks', Limits.getData, (req, res) => {
    var data = req.body;

    if(!verifyToken(res, data)) {
        return;
    }

    eos.getTableRows(true, 'emancontent', data.owner, 'track').then(results => {
        results.rows.forEach(track => {
            track.metadata = JSON.parse( track.metadata );
        });
        
        res.send(resultOk(results));
    }).catch(error => {
        res.send(resultError(error));
    });
})

app.post('/getStatistics', Limits.getData, (req, res) => {
    var data = req.body;

    if(!verifyToken(res, data)) {
        return;
    }

    eos.getTableRows(true, 'emancontent', data.owner, 'stat').then(results => {
        res.send(resultOk(results));
    }).catch(error => {
        res.send(resultError(error));
    });
})

app.post('/play', Limits.changeData, (req, res) => {
    var data = req.body;
    const options = eosCallOptions(["emancontent"], [permissions("emancontent")]);

    if(!verifyToken(res, data)) {
        return;
    }

    eos.contract('emancontent', options).then(contract => {
        contract.play(data).then(function() {
            res.send(resultOk());
        }).catch(error => {
            res.send(resultError(error));
        });
    }).catch(error => {
        res.send(resultError(error));
    });
})

app.post('/startPlaying', Limits.changeData, (req, res) => {
    var data = req.body;
    const options = eosCallOptions(["emancontent"], [permissions("emancontent")]);

    if(!verifyToken(res, data)) {
        return;
    }

    eos.contract('emancontent', options).then(contract => {
        contract.startplaying(data).then(function() {
            res.send(resultOk());
        }).catch(error => {
            res.send(resultError(error));
        });
    }).catch(error => {
        res.send(resultError(error));
    });
})

app.post('/removeTrack', Limits.changeData, (req, res) => {
    var data = req.body;
    const options = eosCallOptions(["emancontent"], [permissions("emancontent")]);

    if(!verifyToken(res, data)) {
        return;
    }

    eos.contract('emancontent', options).then(contract => {
        contract.removetrack(data).then(function() {
            res.send(resultOk());
        }).catch(error => {
            res.send(resultError(error));
        });
    }).catch(error => {
        res.send(resultError(error));
    });
})

app.post('/debugResetGetLimit',(req, res) => {
    var data = req.body;
    Limits.getData.resetKey(req.connection.remoteAddress);
    res.send(resultOk());
})

app.listen(port, () => console.log('Example app listening on port: ' + port));




