"use strict";
var server = require('./server-config');
var Client = require('node-rest-client').Client;

 
module.exports = class EmanateApi {
    constructor() {
        this.host = server.host;
        this.port = server.port;
        this.client = new Client();
    }
    
    args(data, token) {
        result = {
            headers: { "Content-Type": "application/json" },
        }

        if(data != null) {
            result.data = data;
        }

        if(token != null) {
            result.headers['auth-token'] = token;
        }
        
        return result;
    }
    
    url(methodName) {
        return this.host + ':' + this.port + '/v1/' + methodName;
    }
    
    post(methodName, data, token) {
        return new Promise((resolve, reject) => {
            var url = this.url(methodName)
            var args = this.args(data, token);
            //console.log('POS: ' + url);
            // console.log('    ' + JSON.stringify(args));
            this.client.post(url, args, resolve);
        });
    }
    
    get(methodName, token) {
        return new Promise((resolve, reject) => {
            var url = this.url(methodName)
            var args = this.args(null, token);
            // console.log('GET: ' + url);
            // console.log('    ' + JSON.stringify(args));
            this.client.get(url, args, resolve);
        });
    }
    
    put(methodName, data, token) {
        return new Promise((resolve, reject) => {
            var url = this.url(methodName)
            var args = this.args(data, token);
            // console.log('PUT: ' + url);
            // console.log('    ' + JSON.stringify(args));
            this.client.put(url, args, resolve);
        });
    }
    
    delete(methodName, data, token) {
        return new Promise((resolve, reject) => {
            var url = this.url(methodName)
            var args = this.args(data, token);
            // console.log('DEL: ' + url);
            // console.log('    ' + JSON.stringify(args));
            this.client.delete(url, args, resolve);
        });
    }
    



    login(user, pass) {
        return this.post('authenticate', {"user": user, "password": pass});
    }
    
    getUser(userName, token = null) {
        return this.get('user/' + userName, token);
    }

    getAssets(userName, token = null) {
        return this.get('user/' + userName + '/asset', token);
    }
    
    getAsset(userName, asset, token = null) {
        return this.get('user/' + userName + '/asset/' + asset, token);
    }
    
    getContracts(userName, token = null) {
        return this.get('user/' + userName + '/collab', token);
    }

    getContract(userName, contract, token = null) {
        return this.get('user/' + userName + '/collab/' + contract, token);
    }

    getStatistics(userName, token = null) {
        return this.get('user/' + userName + '/asset/statistics', token);
    }
    
    addAsset(userName, metadata, token = null) {
      var params = { "username": userName, "metadata": metadata }
      var data = { parameters: params };
      return this.post('user/' + userName + '/asset', data, token);
    }

    removeAsset(userName, hash, token = null) {
      var data = {  };
      return this.delete('user/' + userName + '/asset/' + hash, data, token);
    }
    
    playAsset(userName, title, token = null) {
        return this.put( 'user/' + userName + '/asset/play/' + title, {}, token);
    }

    collabPropose(userName, params, token = null) {
      var data = { parameters: params };
      return this.post('user/' + userName + '/collab', data, token);
    }

    collabCancel(userName, contractName, token = null) {
      return this.delete('user/' + userName + '/collab/' + contractName, null, token);
    }

    collabAccept(userName, proposer, proposalName, token = null) {
      var params = { "proposer": proposer, "proposal_name": proposalName };
      var data = { parameters: params };
      return this.put('user/' + userName + '/collab/accept', data, token);
    }

    collabReject(userName, proposer, proposalName, token = null) {
      var params = { "proposer": proposer, "proposal_name": proposalName };
      var data = { parameters: params };
      return this.put('user/' + userName + '/collab/reject', data, token);
    }

    resetCounters() {
        return this.put('/debug/resetGetLimit');
    }
}
