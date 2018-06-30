"use strict";

require('jasmine');
var EmanateApi = require('./emanate');
var server = require('./server-config');

jasmine.DEFAULT_TIMEOUT_INTERVAL = 10000;

describe('Authenticate tests', () => {
  
    var emanate = new EmanateApi();
    var testUsers = [];
    var counters = {
      add: 1,
      change: 1,
      get: 100
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
    
    it('Authentication failures', done => {
        emanate.getStatistics('testuser11')
        .then(body => {
            expect(body.success).toBe(false);
            expect(body.data).toBe('You need to authenticate first');
        });
        
        emanate.getStatistics('testuser11', "")
        .then(body => {
            // console.log(JSON.stringify(body));
            expect(body.success).toBe(false);
            expect(body.data).toBe('jwt must be provided');
        });

        emanate.getStatistics('testuser11', server.invalidToken)
        .then(body => {
            expect(body.success).toBe(false);
            expect(body.data).toBe('jwt malformed');
        });

        emanate.getStatistics('testuser11', server.expiredToken)
        .then(body => {
            expect(body.success).toBe(false);
            // expect(body.data).toBe('jwt expired');
            expect(body.data).toBe('invalid signature');
            done();
        });
    });
    
    it('Authenticate', done => {
        emanate.login('testuser11', 'testuser11')
        .then(body => {
            //console.log(JSON.stringify(body));
            expect(body.success).toBe(true);
            expect(body.data).toBeDefined();
            expect(body.data.token).toBeDefined();
            expect(typeof(body.data.token)).toEqual('string')
            expect(body.data.token.length).toBeGreaterThan(0);
            done();
        });
    });
    
    it('Quota limits', done => {
        emanate.resetCounters()
        .then(body => {
            return emanate.login('testuser11', 'testuser11');
        })
        .then(body => {
            expect(body.success).toBe(true);
            expect(body.data).toBeDefined();
            expect(body.data.token).toBeDefined();
            expect(typeof(body.data.token)).toEqual('string')
            expect(body.data.token.length).toBeGreaterThan(0);

            var authToken = body.data.token;
            var promiseArray = [];
            while(counters.get) {
                counters.get -= 1;
                promiseArray.push(emanate.getStatistics('testuser11', authToken));
            }
            
            Promise.all(promiseArray).then(results => {
		        results.map(result => {
                    //console.log(JSON.stringify(result));
                    expect(result.success).toBe(true);
                    expect(result.data).toBeDefined();
                });
                
                emanate.getStatistics('testuser11', authToken)
                .then(body => {
                    expect(body.success).toBe(false);
                    expect(body.data.name).toBe('LimitError');
                    expect(body.data.message).toBe('You reached your quota for getting data');
                    done();
                });
            });
        })
    });
}); 
