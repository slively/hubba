"use strict";

var assert = require('assert-plus');

describe('redirect resource', function() {
    require('../../lib/server').startup({
        port: 8081
    });

    var rootId, id, client = require('restify').createJsonClient({
        version: '*',
        url: 'http://127.0.0.1:8081'
    });

    // get the root id
    it('GET /hubba/api/resources Root id should return a 200 response', function(done) {
        client.get('/hubba/api/resources', function(err, req, res, data) {
            assert.ifError(err);
            rootId = data.id;
            done();
        });
    });

    // add new rest resource
    it('POST new redirect resource called "redirect_resource" to /hubba/api/resources should return a 200 response.', function(done) {

        client.post('/hubba/api/resources', {
            "parentId": rootId,
            "name": "redirect_resource",
            "type": "redirect",
            configuration: {
                url:"http://www.google.com"
            }
        }, function(err, req, res, data) {
            assert.ifError(err);
            id = data.id;
            client.get('/api/redirect_resource', function(err, req, res, data){
                assert.ifError(err);
                assert.equal(301,res.statusCode);
                assert.equal("http://www.google.com",res.headers.location);
                assert.equal("http://www.google.com",data.url);
                done();
            });
        });

    });

    // delete rest resource
    it('DELETE /hubba/api/resources should delete "redirect_resource" return a 200 response.', function(done) {
        client.del('/hubba/api/resources/'+id, function(err, req, res, data) {
            assert.ifError(err);
            done();
        });
    });

});