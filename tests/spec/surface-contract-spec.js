"use strict";

require('jasmine');
var EmanateApi = require('./emanate');

jasmine.DEFAULT_TIMEOUT_INTERVAL = 100000;

describe('Content tests', () => {
  
    var emanate = new EmanateApi();
    var testUsers = [];
    
    beforeAll(() => {
        for(var index = 1; index <= 2; index++) {
            var testUserName = 'testuser' + index;
            for(var index2 = 1; index2 <= 5; index2++) {
                var finalTestUserName = testUserName + index2;
                testUsers.push(testUserName + index2);
            }
        }
    });
    
    it('Create/remove content', (done) => {
        var metadata = {
            "filename": "Title 1",
            "author": "Some Guy",
            "album": "The best of me",
            "year": 2018
        };
        
        var user = 'testuser11';
        var collaborator = 'testuser12';
        var proposal = {
            "proposal_name": "contract1",
            "price": 10000,              
            "filename": "Title 1",
            "requested": [                     
                {
                    "name": "testuser12",      
                    "percentage": 10,           
                    "filename": "Title 1",
                    "accepted": 0                
                }
            ]
        };

        var authToken = null;

        emanate.resetCounters()
        .then(body => {
            return emanate.login(user, user);
        }).then(body => {
            //console.log("login -> " + JSON.stringify(body));
            authToken = body.data.token;

            return emanate.getContracts(user, authToken);
        }).then(body => {
            var promises = [];
            for(var index in body.data) {
                var contract = body.data[index];
                //console.log("Removing " + user + " -> " + contract.name);
                promises.push(emanate.collabCancel(user, contract.name, authToken));
            }
            return Promise.all(promises);
        }).then(body => {
            //console.log(JSON.stringify(body));
            return emanate.collabPropose(user, proposal, authToken);
        }).then(body => {
            //console.log("contract propose -> " + JSON.stringify(body));
            expect(body.success).toBe(true);
            expect(body.data).toBeDefined();

            expect(body.data.name).toBe(proposal.proposal_name);
            expect(body.data.approvals[0].accepted).toBe(proposal.requested[0].accepted);
            
            return emanate.collabAccept(collaborator, user, proposal.proposal_name, authToken);
        }).then(body => {
            //console.log("contract accept -> " + JSON.stringify(body));
            expect(body.success).toBe(true);
            expect(body.data).toBeDefined();
            
            expect(body.data.name).toBe(proposal.proposal_name);
            expect(body.data.approvals[0].accepted).toBe(1);

            return emanate.collabReject(collaborator, user, proposal.proposal_name, authToken);
        }).then(body => {
            //console.log("contract reject -> " + JSON.stringify(body));
            expect(body.success).toBe(true);
            expect(body.data).toBeDefined();

            expect(body.data.name).toBe(proposal.proposal_name);
            expect(body.data.approvals[0].accepted).toBe(0);

            return emanate.collabCancel(user, 'contract1', authToken);
        }).then(body => {
            //console.log("contract cancel -> " + JSON.stringify(body));
            expect(body.success).toBe(true);
            expect(body.data).toBeDefined();
            
            expect(body.data.name).toBe(proposal.proposal_name);

            return emanate.getContracts(user, authToken);
        }).then(body => {
            //console.log(JSON.stringify(body));
            expect(body.success).toBe(true);
            expect(body.data).toBeDefined();
            expect(body.data.length).toBe(0);
            done();
        }).catch(error => {
            console.log(user + " - exception: " + error);
            done();
        });
    });
});
 
