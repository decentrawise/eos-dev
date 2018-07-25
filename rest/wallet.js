"use strict";

var fs = require("fs");
var path = require('path');
require('../scripts/environment');

var Wallet =  {
    getKeyPair: function(accountName, level) {
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
};

module.exports = Wallet;