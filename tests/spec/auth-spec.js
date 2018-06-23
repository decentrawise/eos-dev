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
      get: 50
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
            expect(body.success).toBe(false);
            expect(body.data.name).toBe('JsonWebTokenError');
            expect(body.data.message).toBe('jwt must be provided');
        });

        emanate.getStatistics('testuser11', server.invalidToken)
        .then(body => {
            expect(body.success).toBe(false);
            expect(body.data.name).toBe('JsonWebTokenError');
            expect(body.data.message).toBe('jwt malformed');
        });

        emanate.getStatistics('testuser11', server.expiredToken)
        .then(body => {
            expect(body.success).toBe(false);
            expect(body.data.name).toBe('TokenExpiredError');
            expect(body.data.message).toBe('jwt expired');
            done();
        });
    });
    
    it('Authenticate', done => {
        emanate.login('testuser11', 'testuser11')
        .then(body => {
            console.log(JSON.stringify(body));
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
        .then(budy => {
            return emanate.login('testuser11', 'testuser11');
        })
        .then(body => {
            expect(body.success).toBe(true);
            expect(body.data).toBeDefined();
            expect(body.data.token).toBeDefined();
            expect(typeof(body.data.token)).toEqual('string')
            expect(body.data.token.length).toBeGreaterThan(0);

            var promiseArray = [];
	    console.log('verifying rate limit of ' + counters.get);
            while(counters.get) {
                counters.get -= 1;
		console.log(counters.get);
                promiseArray.push(emanate.getStatistics('testuser11', body.data.token));
            }
            
            Promise.all(promiseArray).then(results => {
                console.log('processing results...');
		results.forEach(result => {
                    expect(result.success).toBe(true);
                    expect(result.data).toBeDefined();
                });
                
		console.log('last call...should fail');
                emanate.getStatistics('testuser11', body.data.token)
                .then(body => {
		    console.log('last result...should be a failure...' + JSON.stringify(body));
                    expect(body.success).toBe(false);
                    expect(body.data.name).toBe('LimitError');
                    expect(body.data.message).toBe('You reached your quota for getting data');
                    done();
                });
            });
        })
    });
    
}); 
