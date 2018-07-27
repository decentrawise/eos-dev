"use strict";

require('jasmine');
var EmanateApi = require('./emanate');

jasmine.DEFAULT_TIMEOUT_INTERVAL = 100000;

describe('Content tests', () => {
  
    var emanate = new EmanateApi();
    var testUsers = [];
    var user = 'testuser11';
    var metadata = {
        "title": "Title 1",
        "filename": "Title 1",
        "author": "Some Guy",
        "album": "The best of me",
        "year": 2018
    };
    
    
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
        var authToken = null;
        var insertedAsset = null;

        emanate.resetCounters()
        .then(body => {
            return emanate.login(user, user);
        }).then(body => {
            //console.log("login -> " + JSON.stringify(body));
            authToken = body.data.token;
            return emanate.getAssets(user, authToken);
        }).then(body => {
            //console.log(JSON.stringify(body));
            var promises = [];
            for(var index in body.data) {
                var asset = body.data[index];
                //console.log("Removing " + user + " -> " + asset.metadata.hash);
                promises.push(emanate.removeAsset(user, asset.metadata.hash, authToken));
            }
            return Promise.all(promises);
        }).then(body => {
            //console.log("removeAssets -> " + JSON.stringify(body));
            return emanate.addAsset(user, metadata, authToken)
        }).then(body => {
            //console.log('addAsset -> ' + JSON.stringify(body));
            expect(body.success).toBe(true);
            expect(body.data).toBeDefined();
            expect(body.data.metadata.title).toBe(metadata.title);
            expect(body.data.metadata.hash).toBeDefined();
            expect(body.data.metadata.hash.length).toBeDefined();
            expect(body.data.metadata.hash.length).toBe(64);

            insertedAsset = body.data;

//            return new Promise((resolve, reject) => {(resolve, 2000);});
//        }).then(() => {
//            return emanate.playAsset(user, insertedAsset.hash);
//        }).then(body => {
//            expect(body.success).toBe(true);
//            expect(body.data).toBeDefined();

            return emanate.removeAsset(user, insertedAsset.metadata.hash, authToken);
        }).then(body => {
            //console.log('removeAsset -> ' + JSON.stringify(body));
            expect(body.success).toBe(true);
            expect(body.data).toBeDefined();
            expect(body.data.metadata.title).toBe(metadata.title);
            expect(body.data.metadata.hash).toBeDefined();
            expect(body.data.metadata.hash.length).toBeDefined();
            expect(body.data.metadata.hash.length).toBe(64);
            
            return emanate.getAssets(user, authToken);
        }).then(body => {
            expect(body.success).toBe(true);
            expect(body.data).toBeDefined();
            expect(body.data.length).toBe(0);
            done();
        }).catch(error => {
            //console.log(user + " - exception: " + error);
            done();
        })
    });
});
