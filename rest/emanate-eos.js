"use strict";

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
        };
    },
    tableParams: function(code, scope, table, key, lowerBound = "", maxRows = -1){
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
    instance: function(config) {
        var result = Eos(config);
        var common = require('./common');

        result.encode = function(name) {
            return Eos.modules.format.encodeName(name, false);;
        };
    
        result.getFirstRecord = function(params) {
            params.limit = 1;
            return new Promise((resolve, reject) => {
                this.getTableRows(params).then(results => {
                    if(results.rows.length > 0) {
                        resolve(results.rows[0]);
                        return;
                    }
                    resolve(null);
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
