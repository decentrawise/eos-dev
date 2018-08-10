"use strict";

var Eos = require('eosjs');

var EOS = {
    getEOSConfig: function(keys) {
        var common = require('./common');

        return {
            httpEndpoint: common.config.eos.host + ":" + common.config.eos.port,
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
        return {actor: user, permission: level};
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
        };
    },
    encode: function(name) {
        return Eos.modules.format.encodeName(name, false);
    },
    tableParams: function(code, scope, table, key, lowerBound = 0, maxRows = -1){
        return {
            //  EOS
            json: true,
            code: code,
            scope: scope,
            table: table,
            table_key: key,
            lower_bound: lowerBound,
            limit: 10,
            //  Ours
            max_rows: maxRows
          };
    },
    collabTableParams: function(userName, lowerBound = null, maxRows = -1){
        if(lowerBound) {
            return this.tableParams('emancollab', userName, 'proposal', 'name', Eos.modules.format.encodeName(lowerBound), maxRows);
        }
        return this.tableParams('emancollab', userName, 'proposal', 'name', 0, maxRows);    
    },
    assetTableParams: function(userName, lowerBound = 0, maxRows = -1){
        return this.tableParams('emancontent', userName, 'soundasset', 'id', lowerBound, maxRows);
    },    
    instance: function(config) {
        var result = Eos(config);

        /*result.encode = function(name) {
            return Eos.modules.format.encodeName(name, false);;
        };*/
    
        result.getFirstRecord = function(params) {
            params.limit = 1;
            return new Promise((resolve, reject) => {
                this.getTableRows(params).then(results => {
                    if(results.rows.length == 0) {
                        resolve(null);
                        return;
                    }

                    var key = results.rows[0][params.table_key];
                    if(typeof key == "string") {
                        key = Eos.modules.format.encodeName(key);
                    }
                    if(key != params.lower_bound) {
                        resolve(null);
                        return;
                    }
                    resolve(results.rows[0]);
                }).catch(error => {
                    console.log("getFirstRecord - catch - " + JSON.stringify(error));
                    reject();
                });
            });
        };

        result.getAllTableRows = function(params, callback, resultRows = []) {
            this.getTableRows(params).then(results => {
                resultRows = resultRows.concat(results.rows);
                console.log(JSON.stringify(resultRows));
                if (results.more == true) {
                    var lastRow = resultRows[resultRows.length - 1];
                    params.lower_bound = lastRow[params.table_key];
                    resultRows = resultRows.slice(0, -1);

                    this.getAllTableRows(params, callback, resultRows);
                    return;
                }

                if (params.max_rows > 0 && resultRows.length >= params.max_rows) {
                    result = resultRows.slice(0, params.max_rows);
                }
                callback(resultRows);
            });
        };
/*
        result.getContracts = function(contractNames) {
            var promises = [];

            for(var index in contractNames) {
                var name = contractNames[index];
                promises.push(this.contract(name, Eos.callOptions([name], [Eos.permissions(name)])));
            }

            return Promise.all(promises);
        }
*/
        return result;
    }

/*
        result.getAllTableRows = function getTable(res, params, result = []) {
            this.getTableRows(params).then(results => {
                if (result.length > 0) {
                    result = result.slice(0, -1);
                }

                result = result.concat(results.rows);
        
                if (results.more == false || (params.max_rows > 0 && result.length >= params.max_rows)) {
                    if (result.length > params.max_rows) {
                        result = result.slice(0, params.max_rows);
                    }
                    res.send(common.responses.ok(result));
                    return;
                }
        
                var lastRow = results.rows[results.rows.length - 1];
                params.lower_bound = lastRow[params.table_key];
                this.getAllTableRows(res, params, result);        
                return;
            }).catch(error => {
                res.send(common.responses.error(error));
            });
        }

        return result;
    }
    */
//    config: getEOSConfig();
//    var eos = Eos(config);
};


module.exports = EOS;
