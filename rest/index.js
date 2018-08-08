"use strict";

var common = require('./common');

var express = require('express');
var app = express();
var cors = require('cors');
var bodyParser = require('body-parser');
var router = express.Router();
var port = common.config.api.port;

app.use(bodyParser.json());
app.use(cors());

app.use(function(req, res, next) {
    req.results = {};
    req.results.ok = function (data) {
        if( data == null ) {
            data = {};
        }
        return { success: true, data: data };
    }
    req.results.error = function (data) {
        if( data == null ) {
            data = {};
        }
        return { success: false, data: data };
    }
    next();
});

app.use('/v1', require('./v1'));


router.get('/', (req, res) => res.send('Welcome to the Emanate API<p><a href="/api">Documentation<a/>'))
app.use('/', router);


app.listen(port, function () { 
    console.log('Example app listening on port: ' + port); 
});

