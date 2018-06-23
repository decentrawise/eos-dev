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
        
        testUsers.forEach((user) => {
            emanate.addContent(user, 'Title 1', metadata)
            .then(body => {
                expect(body.success).toBe(true);
                expect(body.data).toBeDefined();
                
                return emanate.getTracks(user);
            })
            .then(body => {
                expect(body.success).toBe(true);
                expect(body.data).toBeDefined();
                expect(body.data.rows).toBeDefined();
                expect(body.data.rows.length).toBe(1);
                
                return emanate.removeContent(user, 'Title 1');
            })
            .then(body => {
                expect(body.success).toBe(true);
                expect(body.data).toBeDefined();
                
                return emanate.getTracks(user);
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
