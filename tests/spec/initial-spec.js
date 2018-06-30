"use strict";

require('jasmine');
var EmanateApi = require('./emanate');

jasmine.DEFAULT_TIMEOUT_INTERVAL = 1000;

describe('T0 tests', () => {
  
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

    it('get tracks', (done) => {
        testUsers.forEach((user) => {
            emanate.login(user, user)
            .then(body => {
                return emanate.getTracks(user, body.data.token)
            })
            .then(body => {
                //console.log(JSON.stringify(body));
                expect(body.success).toBe(true);
                expect(body.data.rows).toBeDefined();
                expect(body.data.rows.length).toBe(0);
                done();
            });
        });
    });

    it('get user', (done) => {
        testUsers.forEach((user) => {
            emanate.login(user, user)
            .then(body => {
                return emanate.getUser(user, body.data.token);
            })
            .then(body => {
                expect(body.success).toBe(true);
                expect(body.data.username).toBe(user);
                done();
            });
        });
    });

    it('get contracts', (done) => {
        testUsers.forEach((user) => {
            emanate.login(user, user)
            .then(body => {
                return emanate.getContracts(user, body.data.token)
            })
            .then(body => {
                expect(body.success).toBe(true);
                expect(body.data.rows).toBeDefined();
                expect(body.data.rows.length).toBe(0);
                done();
            });
        });
    });


    it('get statistics', (done) => {
        testUsers.forEach((user) => {
            emanate.login(user, user)
            .then(body => {
                return emanate.getStatistics(user, body.data.token)
            })
            .then(body => {
                expect(body.success).toBe(true);
                expect(body.data.rows).toBeDefined();
                expect(body.data.rows.length).toBe(0);
                done();
            });
        });
    });

    // TODO: Failing tests like accept/reject contracts, remove content, etc
    
}); 
