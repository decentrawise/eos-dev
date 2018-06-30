
var Eos = require('eosjs');

var EOS = {
    getEOSConfig: function(keys) {
        return {
            httpEndpoint: 'http://localhost:8888',
            binaryen: require("binaryen"),
            keyProvider: keys,
            expireInSeconds: 60,
            broadcast: true,
            debug: false, // API and transactions
            sign: true,
            chainId: null // genesis.json::initial_chain_id       
        }
    },    
    permissions: function(user, level) {
        if (level == null) {
            level = 'active';
        }
        return {account: user, permission: level};
    },    
    callOptions: function(scopes, permissions) {
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
    },
    instance: function(config) {
        return Eos(config);
    }
//    config: getEOSConfig();
//    var eos = Eos(config);
};


module.exports = EOS;
