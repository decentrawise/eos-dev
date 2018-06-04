"use strict";

var fs = require("fs");
var path = require('path');
var Eos = require('eosjs');
const express = require('express');
var cors = require('cors');
const app = express();
var bodyParser = require('body-parser');

app.use(bodyParser.json());
app.use(cors());

function getKeyPair(accountName, level) {

    var result = {};
    var walletPath = path.join(process.env.HOME, 'wallet_info');
    
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
        ]
    }
}

function permissions(user, level) {
    if (level == null) {
        level = 'active';
    }
    return {account: user, permission: level};
}

const config = getEOSConfig();
var eos = Eos.Testnet(config);

app.get('/', (req, res) => res.send('Welcome to the Emanate API<p><a href="/api">Documentation<a/>'))

app.get('/api', function(req, res) {
    res.sendFile(path.join(process.cwd(), 'api.html'));
});


app.post('/propose', (req, res) => {
    var data = req.body;
    const options = eosCallOptions(["emancollab"], [permissions("emancollab"), permissions(data.name)]);

    eos.contract('emancollab', options).then(contract => {
        contract.propose(data.from, data.name, data.price, data.filename, data.partners).then(function() { 
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
        contract.approve(data.proposer, data.name, data.from, { authorization: data.from }).then(function() {
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
        contract.unapprove(data.proposer, data.name, data.from, { authorization: data.from }).then(function() { 
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

    console.log("step 1");
    eos.contract('emancontent', options).then(contract => {
        console.log("step 2");
        contract.addtrack(data.owner, data.metadata).then(function() { 
            console.log("step 3");
            res.send(resultOk());
            console.log("step 4");
        }).catch(error => {
            console.log("step 5");
            res.send(resultError(error));
            console.log("step 6");
        });
    }).catch(error => {
        console.log("step 7 - " + error);
        res.send(resultError(error));
        console.log("step 8");
    });
    console.log("step 9");
})

app.post('/getTracks', (req, res) => {
    var data = req.body;

    eos.getTableRows(true, 'emancontent', data.owner, 'track').then(results => {
        res.send(resultOk(results));
    }).catch(error => {
        res.send(resultError(error));
    });
})

app.listen(3000, () => console.log('Example app listening on port 3000!')) 
