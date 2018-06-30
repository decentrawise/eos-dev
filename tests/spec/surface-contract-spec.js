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
        
        // testUsers.forEach((user) => {
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

        emanate.login(user, user)
        .then(body => {
            var authToken = body.data.token;

            emanate.collabPropose(user, proposal, authToken)
            .then(body => {
                expect(body.success).toBe(true);
                expect(body.data).toBeDefined();
                
                return emanate.getContracts(user, authToken);
            })
            .then(body =>{
                //console.log(JSON.stringify(body));
                expect(body.success).toBe(true);
                expect(body.data).toBeDefined();
                expect(body.data.rows).toBeDefined();
                expect(body.data.rows.length).toBe(1);

                return emanate.collabAccept(collaborator, user, proposal.proposal_name, authToken);
            })
            .then(body => {
                //console.log(JSON.stringify(body));
                expect(body.success).toBe(true);
                expect(body.data).toBeDefined();

                return emanate.getContracts(user, authToken);
            })
            .then(body => {
                //console.log(JSON.stringify(body));
                expect(body.success).toBe(true);
                expect(body.data).toBeDefined();
                expect(body.data.rows).toBeDefined();
                expect(body.data.rows.length).toBe(1);
                
                expect(body.data.rows[0].name).toBe(proposal.proposal_name);
                // TODO: Check if it was accepted

                return emanate.collabReject(collaborator, user, proposal.proposal_name, authToken);
            })
            .then(body => {
                expect(body.success).toBe(true);
                expect(body.data).toBeDefined();

                return emanate.getContracts(user, authToken);
            })
            .then(body => {
                expect(body.success).toBe(true);
                expect(body.data).toBeDefined();

                return emanate.getContracts(user, authToken);
            })
            .then(body => {
                expect(body.success).toBe(true);
                expect(body.data).toBeDefined();
                expect(body.data.rows).toBeDefined();
                expect(body.data.rows.length).toBe(1);
                
                expect(body.data.rows[0].name).toBe(proposal.proposal_name);
                // TODO: Check if it was rejected
                
                return emanate.collabCancel(user, 'contract1', authToken);
            })
            .then(body => {
                //console.log(JSON.stringify(body));
                expect(body.success).toBe(true);
                expect(body.data).toBeDefined();
                
                return emanate.getContracts(user, authToken);
            })
            .then(body => {
                expect(body.success).toBe(true);
                expect(body.data).toBeDefined();
                expect(body.data.rows).toBeDefined();
                expect(body.data.rows.length).toBe(0);
                done();
            })
            .catch(error => {
                console.log(user + " - exception: " + error);
                done();
            });
        });
    });
});
 
