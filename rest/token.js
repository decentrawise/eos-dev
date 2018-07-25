"use strict";

var jwt = require('jsonwebtoken');
var responses = require('./responses');
var wallet = require('./wallet');

var Token = {
    verify: (req, res, next) => {
        var token = req.get('auth-token');

        if(token == null) {
            console.log('No auth token found: ' + JSON.stringify(req.headers));
            return res.json(responses.error('You need to authenticate first'));
        }
        
        var result = jwt.verify(token, wallet.getKeyPair('emancontent').private, (error, decoded) => {
            if(error) {
                return res.json(responses.error(error.message));
            }

            req.decoded = decoded;
            next();
        });
    },
    create: (userName) => {
        var payload = { id: userName };
        return jwt.sign(payload, wallet.getKeyPair('emancontent').private, { expiresIn: 60 });
    }
}


module.exports = Token