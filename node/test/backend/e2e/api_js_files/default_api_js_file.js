"use strict";

var assert = require('assert-plus');

describe('resource api javascript file', function() {
    var Server = require('../../ lib/server').startup({
        port: 8081
    });

    var rootId,
        id,
        window,
        client = require('restify').createJsonClient({
            version: '*',
            url: 'http://127.0.0.1:8081'
        }),
        stringClient = require('restify').createStringClient({
            version: '*',
            url: 'http://127.0.0.1:8081'
        })


    it(' should get the root resource id.', function(done) {
        client.get('/hubba/api/resources', function(err, req, res, data) {
            assert.ifError(err);
            rootId = data.id;
            done();
        });
    });


    it(' should POST a new area resource called "area".', function(done) {

        client.post('/hubba/api/resources', {
            "parentId": rootId,
            "name": "area",
            "type": "area"
        }, function(err, req, res, data) {
            assert.ifError(err);
            id = data.id;
            done();
        });

    });


    it(' should POST a new controller resource called "controller" as a child of "area".', function(done) {

        var get = "res.send('get');",
            post = "res.send('post');",
            put = "res.send('put');",
            patch = "res.send('patch');",
            del = "res.send('delete');";

        client.post('/hubba/api/resources', {
            "parentId": id,
            "name": "controller",
            "type": "controller",
            "configuration": {
                "get": get,
                "post": post,
                "put": put,
                "patch": patch,
                "del": del
            }
        }, function(err, req, res, data) {
            assert.ifError(err);
            id = data.id;
            done();
        });

    });

    it(' should get the api.js file from /hubba/api.js which should be part of the window object.', function(done){
        stringClient.get('/hubba/api.js',function(err,req,res,data){

            assert.ifError(err);

            try {
                eval(data);
            } catch(e){
                assert.ifError(e);
            };

            assert.ok(window.hubba);

            done();
        });
    });

    // attempt to call all verbs on both the area and controller resources.... shit, this requires a real browser to test.
    //  http://phantomjs.org/
    //  http://metaskills.net/mocha-phantomjs/

    it(' should safely shutdown the server', function(done){
        Server.close();
        done();
    });

});