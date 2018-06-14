"use strict";

require('../scripts/environment.js');
var fs = require("fs");
var path = require('path');
var Eos = require('eosjs');
const express = require('express');
var cors = require('cors');
const app = express();
var bodyParser = require('body-parser');


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
            getKeyPair('collabuser1').private,
            getKeyPair('collabuser2').private,
            getKeyPair('collabuser3').private,
            getKeyPair('collabuser4').private,
            getKeyPair('user1').private,
            getKeyPair('user2').private,
            getKeyPair('user3').private,
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

const config = getEOSConfig();
var eos = Eos(config);

app.get('/', (req, res) => res.send('Welcome to the Emanate API<p><a href="/api">Documentation<a/>'))

app.get('/api', function(req, res) {
    res.sendFile(path.join(process.cwd(), 'api.html'));
});


app.post('/propose', (req, res) => {
    var data = req.body;
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

app.post('/accept', bodyParser.json(), (req, res) => {
    var data = req.body;
    const options = eosCallOptions(["emancollab"], [permissions("emancollab")]);
    
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

app.post('/reject', (req, res) => {
    var data = req.body;
    const options = eosCallOptions(["emancollab"], [permissions("emancollab")]);

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

app.post('/cancel', (req, res) => {
    var data = req.body;
    
    res.send("Canceling the proposal");
})

app.post('/execute', (req, res) => {
    var data = req.body;
    const options = eosCallOptions(["emancollab"], [permissions("emancollab")]);
    
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

app.post('/getContract', (req, res) => {
    var data = req.body;

    console.log(data);
    eos.getTableRows(true, 'emancollab', data.proposer, 'proposal').then(results => {
        //  TODO: Go through the results and find the proper contract from this user
        res.send(resultOk(results));
    }).catch(error => {
        res.send(resultError(error));
    });
})

app.post('/addTrack', (req, res) => {
    var data = req.body;
    const options = eosCallOptions(["emancontent"], [permissions("emancontent")]);

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

app.post('/getTrack', (req, res) => {
    var data = req.body;

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


app.post('/getTracks', (req, res) => {
    var data = req.body;

    eos.getTableRows(true, 'emancontent', data.owner, 'track').then(results => {
        results.rows.forEach(track => {
            track.metadata = JSON.parse( track.metadata );
        });
        
        res.send(resultOk(results));
    }).catch(error => {
        res.send(resultError(error));
    });
})


app.post('/getStatistics', (req, res) => {
    var data = req.body;

    eos.getTableRows(true, 'emancontent', data.owner, 'stat').then(results => {
        res.send(resultOk(results));
    }).catch(error => {
        res.send(resultError(error));
    });
})


app.post('/play', (req, res) => {
    var data = req.body;
    const options = eosCallOptions(["emancontent"], [permissions("emancontent")]);

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

app.post('/startPlaying', (req, res) => {
    var data = req.body;
    const options = eosCallOptions(["emancontent"], [permissions("emancontent")]);

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


app.post('/removeTrack', (req, res) => {
    var data = req.body;
    const options = eosCallOptions(["emancontent"], [permissions("emancontent")]);

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

app.listen(port, () => console.log('Example app listening on port: ' + port));




