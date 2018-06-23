"use strict";
var server = require('./server-config');
var Client = require('node-rest-client').Client;

 
module.exports = class EmanateApi {
    constructor() {
        this.host = server.host;
        this.port = server.port;
        this.client = new Client();
    }
    
    args(data) {
      result = {
        headers: { "Content-Type": "application/json" },
        data: data
      }
      return result;
    }
    
    url(methodName) {
      return this.host + ':' + this.port + '/' + methodName;
    }
    
    sleep(miliseconds) {
        var now = new Date().getTime();
        while(new Date().getTime() < now + miliseconds){ /* do nothing */ } 
    }
    
    post(methodName, data) {
        return new Promise((resolve, reject) => {
            this.client.post(this.url(methodName), this.args(data), resolve);
        });
    }
    
//     postSync(methodName, data) {
//         return new Promise(resolve => {
//             this.client.post(this.url(methodName), this.args(data), (data, response) => { 
//               console.log("postSync: " + JSON.stringify(data));
//               resolve(data);
//             });
//         });
//     }
    
    login(user, pass) {
        return this.post('authenticate', {"user": user, "password": pass});
    }
    
    resetCounters() {
        return this.post('debugResetGetLimit');
    }
    
//     async loginSync(user, pass) {
//         return await this.postSync('authenticate', {"user": user, "password": pass});
//     }

    getTracks(userName, token = null) {
      var params = { "owner": userName };
      var data = { parameters: params };
      if(token != null)
          data.token = token;
      return this.post('getTracks', data);
    }
    
    getContracts(userName, token = null) {
      var params = { "proposer": userName };
      var data = { parameters: params };
      if(token != null)
          data.token = token;
      return this.post('getContracts', data);
    }

    getStatistics(userName, token = null) {
      var params = { "owner": userName };
      var data = { parameters: params };
      if(token != null)
          data.token = token;
      return this.post('getStatistics', data);
    }
    
    addContent(userName, title, metadata, token = null) {
      var params = { "owner": userName, "title": title, "metadata": metadata }
      var data = { parameters: params };
      if(token != null)
          data.token = token;
      return this.post('addTrack', data);
    }

    removeContent(userName, title, token = null) {
      var params = { "owner": userName, "title": title };
      var data = { parameters: params };
      if(token != null)
          data.token = token;
      return this.post('removeTrack', data);
    }
    
    propose(params, token = null) {
      var data = { parameters: params };
      if(token != null)
          data.token = token;
      return this.post('propose', data);
    }

    cancel(proposer, proposalName, canceler, token = null) {
      var params = { "proposer": proposer, "proposal_name": proposalName, "canceler": canceler };
      var data = { parameters: params };
      if(token != null)
          data.token = token;
      return this.post('cancel', data);
    }

    accept(proposer, proposalName, accepter, token = null) {
      var params = { "proposer": proposer, "proposal_name": proposalName, "accepter": accepter };
      var data = { parameters: params };
      if(token != null)
          data.token = token;
      return this.post('accept', data);
    }

    reject(proposer, proposalName, unaccepter, token = null) {
      var params = { "proposer": proposer, "proposal_name": proposalName, "unaccepter": unaccepter };
      var data = { parameters: params };
      if(token != null)
          data.token = token;
      return this.post('reject', data);
    }
}
