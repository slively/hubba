"use strict";

var assert = require("assert-plus");


describe('Server', function() {

    var rootId, id, client = require('restify').createJsonClient({
        version: '*',
        url: 'http://127.0.0.1:8081'
    }), httpClient = require('restify').createClient({
        version: '*',
        url: 'http://127.0.0.1:8081'
    });;

    it('GET /hubba/api/resources should return resources as an array.', function(done) {
        client.get('/hubba/api/resources', function(err, req, res, data) {
            assert.ifError(err);
            assert.arrayOfObject(data);
            done();
        });
    });

    it('GET /hubba/api/resources?tree=true should return resources as a tree.', function(done) {
        client.get('/hubba/api/resources?tree=true', function(err, req, res, data) {
            assert.ifError(err);
            assert.object(data);
            assert.object(data.children);
            done();
        });
    });

    it('GET /hubba/api/resource_types should return all resource types as an array.', function(done) {
        client.get('/hubba/api/resource_types', function(err, req, res, data) {
            assert.ifError(err);
            assert.arrayOfObject(data);
            assert.ok(data.length > 1);
            done();
        });
    });

    it('GET /hubba/api/resource_types?object=true should return all resource types as an object.', function(done) {
        client.get('/hubba/api/resource_types?object=true', function(err, req, res, data) {
            assert.ifError(err);
            assert.object(data);
            assert.ok(data.area);
            done();
        });
    });

    it('GET /hubba-admin/ should return admin index page.', function(done) {
        httpClient.get('/hubba-admin', function(err, req){
            assert.ifError(err);

            req.on('result', function(err, res) {
                assert.ifError(err); // HTTP status code >= 400

                res.body = '';
                res.setEncoding('utf8');
                res.on('data', function(chunk) {
                    res.body += chunk;
                });

                res.on('end', function() {
                    assert.ok(res.body.indexOf('<title>Welcome to Hubba!</title>' > -1),"No information received!")
                    done();
                });
            });

        });
    });

    it('GET /hubba-admin/other should return the other index page.', function(done) {
        httpClient.get('/hubba-admin', function(err, req){
            assert.ifError(err);

            req.on('result', function(err, res) {
                assert.ifError(err); // HTTP status code >= 400

                res.body = '';
                res.setEncoding('utf8');
                res.on('data', function(chunk) {
                    res.body += chunk;
                });

                res.on('end', function() {
                    assert.ok(res.body.indexOf('<title>Other</title>' > -1),"No information received!")
                    done();
                });
            });

        });
    });

    it('GET /hubba-admin/ should return the 50x page.', function(done) {
        httpClient.get('/hubba-admin', function(err, req){
            assert.ifError(err);

            req.on('result', function(err, res) {
                assert.ifError(err); // HTTP status code >= 400

                res.body = '';
                res.setEncoding('utf8');
                res.on('data', function(chunk) {
                    res.body += chunk;
                });

                res.on('end', function() {
                    assert.ok(res.body.indexOf('<title>Error</title>' > -1),"No information received!")
                    done();
                });
            });

        });
    });

});