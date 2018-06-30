"use strict";

process.chdir(process.env.PWD);

var path = require('path');
require('./environment.js');
var Eos = require('eosjs')
let {ecc} = Eos.modules
var execSync = require('child_process').execSync;
var fs = require("fs");
var binaryen = require('binaryen')


function sleep(secs) {
  execSync("sleep " + secs);
}



class EOSClient {
    constructor() {
        this.path = path.join(process.env.EOS_BIN, 'cleos');
        this.walletPath = process.env.EOS_WALLET_INFO;
        this.eosContractsPath = process.env.EOS_CONTRACTS
        this.userContractsPath = process.env.USER_CONTRACTS
        
        if (fs.exists(this.path) == false) {
            throw "EOSClient application not found (" + this.path + ')';
        }
    }
    
    createCommand(command, params) {
        var commandArray = [this.path, command].concat(params);
        return commandArray.join(' ');
    }

    executeCommand(command)
    {
        var result = { status: 0 };
        try {
            result.output = execSync(command).toString();
        }
        catch( error ) {
            result = error;
        }
        return result;
    }
    
    setContract(contract, permission) {
        var command = this.createCommand('set contract', [permission, contract, '--permission', permission]);
        console.log(command);
        return this.executeCommand(command);
    }
    
    setSystemContract(contractName, permission) {
        return this.setContract(path.join(this.eosContractsPath, contractName), permission);
    }
    
    setUserContract(contractName, permission) {
        return this.setContract(path.join(this.userContractsPath, contractName), contractName);
    }
    
    createKeyPair() {
        var result = {}
        var cmd = this.createCommand('create key');
        var execResult = execSync(cmd).toString();
            
        var lines = execResult.split('\n');
        lines.forEach(line => {
            if (line.trim() == '')
                return;
            var parts = line.split(':');
            result[parts[0].split(' ')[0].toLowerCase()] = parts[1];
        });

        return result;
    }

    getKeyPair(accountName, level) {

        var result = {};
        
        if( level == 'wallet' ) {
            var privateKeyFile = path.join(this.walletPath, accountName, 'wallet', 'private');
            if( fs.existsSync(privateKeyFile) == false ) {
                throw "Wallet was not created yet";
            }
            result.private = fs.readFileSync(privateKeyFile).toString();
        }
        else {
            var privateKeyFile = path.join(this.walletPath, accountName, level, 'private');
            var publicKeyFile = path.join(this.walletPath, accountName, level, 'public');
            
            if( fs.existsSync(privateKeyFile) == false || fs.existsSync(publicKeyFile) == false ) {
                this.storeKeyPair(accountName, level, this.createKeyPair())
            }
            
            
            result.private = fs.readFileSync(privateKeyFile).toString().trim();
            result.public = fs.readFileSync(publicKeyFile).toString().trim();
        }
        return result;
    }
    
    storeKeyPair(accountName, level, keyPair) {
        var basePath = path.join(this.walletPath, accountName, level);
        execSync('mkdir -p ' + basePath);
        
        if( level == 'wallet' ) {
            fs.writeFileSync(path.join(basePath, 'private'), keyPair.private, 'utf8');
        }
        else {
            fs.writeFileSync(path.join(basePath, 'private'), keyPair.private, 'utf8');
            fs.writeFileSync(path.join(basePath, 'public'), keyPair.public, 'utf8');
        }
    }
    
    createWallet(walletName) {
        var command = this.createCommand('wallet create', ['--name', walletName]);
        var result = this.executeCommand(command);
        
        if( result.status == 0 ) {
            var pass = result.output.split('\n')[3].replace(/"/g, '');
            this.storeKeyPair(walletName, 'wallet', {private: pass});
        }
        return result;
    }
    
    
    unlockWallet(walletName)
    {
        var command = this.createCommand('wallet open', ['--name', walletName]);
        console.log(command);
        this.executeCommand(command);

        var pass = this.getKeyPair(walletName, 'wallet');
        var command = this.createCommand('wallet unlock', ['--name', walletName, '--password', pass.private]);
        console.log(command);
        return this.executeCommand(command);
    }

    insertKeysToWallet(walletName, keyPair) {
        var command = this.createCommand('wallet import' , ['--name', walletName, keyPair.private]);
        return this.executeCommand(command);
    }
    
    createAccount(accountName) {
        this.createWallet(accountName);
        this.unlockWallet(accountName);
        
        this.insertKeysToWallet(accountName, this.getKeyPair(accountName, 'owner'));
        this.insertKeysToWallet(accountName, this.getKeyPair(accountName, 'active'));

        var command = this.createCommand('create account', ['eosio', accountName, this.getKeyPair(accountName, 'owner').public, this.getKeyPair(accountName, 'active').public]);
        var result = this.executeCommand(command);
    }
    
    installContract(contractName) {
        this.createAccount(contractName);
        this.setUserContract(contractName);
    }
    
    pushAction(contractName, action, data, permissions) {
        var permissionsParsed = [];
        permissions.forEach(permission => {
            permissionsParsed = permissionsParsed.concat(['--permission', permission]);
        });
        var command = this.createCommand('push action', [contractName, action, "'" + JSON.stringify(data) + "'"].concat(permissionsParsed));
        return this.executeCommand(command);
    }
    
    getAccountBalance(accountName, token) {
        var command = this.createCommand('get currency balance', ['eosio.token', accountName, token]);
        var result = this.executeCommand(command);
        if( result.status == 0 ) {
            return result.output.toString();
        }
        return result;
    }
    
    createToken(amount) {
        var command = this.createCommand('push action', ['eosio.token', 'create', '\'["eosio", "' + amount + '", 0, 0, 0]\''].concat(['--permission eosio.token']));
        console.log(command);
        return this.executeCommand(command);
    }
    
    issueTokens(accountName, amount, token) {
        var data = {
            "to": accountName,
            "quantity": [amount + '.0000', token].join(' '),
            "memo": "First issue"
        };
        this.pushAction('eosio.token', 'issue', data, ['eosio']);
    }
    
    transferTokens(from, to, amount, token) {
        var data = {
            "from": from,
            "to": to,
            "quantity": [amount + '.0000', token].join(' '),
            "memo": "First payout"
        };
        this.pushAction('eosio.token', 'transfer', data, [from]);
    }
    
    setAccountPermission(accountName, permissionName, permission) {
        var data = {
            threshold: 1,
            keys: [
                {
                  key: this.getKeyPair(accountName, permissionName).public,
                  weight: 1
                }
            ],
            accounts: [
                {
                    permission:
                        {
                          actor: permission.split('@')[0],
                          permission: permission.split('@')[1]
                        },
                        weight:1
                }
            ]
        }
        
        var command = this.createCommand('set account permission', [accountName, permissionName, "'" + JSON.stringify(data) + "'", 'owner', '--permission ' + accountName]);
        return this.executeCommand(command);
    };
        
}

var cleos = new EOSClient();

// Initialize system
cleos.createWallet('default');
cleos.unlockWallet('default');

cleos.setSystemContract('eosio.system', 'eosio');
cleos.setSystemContract('eosio.bios', 'eosio');

cleos.createAccount('eosio.token');
cleos.setSystemContract('eosio.token', 'eosio.token');

cleos.createToken('1000000000.0000 EOS');
cleos.createToken('1000000000.0000 BEAT');

cleos.installContract('emancollab');
cleos.installContract('emancontent');

cleos.issueTokens('emancollab', 100000, 'BEAT');
cleos.issueTokens('emancontent', 10000, 'BEAT');

for(var index = 1; index <= 2; index++) {
  var userName = 'user' + index;
  var testUserName = 'testuser' + index;

  for(var index2 = 1; index2 <= 5; index2++) {
    var finalUserName = userName + index2;
    var finalTestUserName = testUserName + index2;
    
    cleos.createAccount(finalUserName);
    cleos.issueTokens(finalUserName, 1000, 'BEAT');
    cleos.setAccountPermission(finalUserName, 'active', 'emancollab@eosio.code')
    
    cleos.createAccount(finalTestUserName);
    cleos.issueTokens(finalTestUserName, 1000, 'BEAT');
    cleos.setAccountPermission(finalTestUserName, 'active', 'emancollab@eosio.code')
  }
}



