"use strict";

var assert = require("assert-plus");

describe('Misc Bugs', function() {

    describe('Change resource type, update configuration an attempt to use the resource', function(){
        var rootId, id, client = require('restify').createJsonClient({
            version: '*',
            url: 'http://127.0.0.1:8081'
        });

        // get root resource
        it('GET /hubba/api/resources should get a 200 response', function(done) {
            client.get('/hubba/api/resources/root', function(err, req, res, data) {
                assert.ifError(err);
                rootId = data.id;
                done();
            });
        });

        // add new email resource
        it('should add a new area resource', function(done) {

            client.post('/hubba/api/resources', {
                parentId: rootId,
                name: 'test',
                type: 'area'
            }, function(err, req, res, data) {
                assert.ifError(err);
                id = data.id;
                done();
            });

        });

        it('should update to be a dummy email resource', function(done) {

            client.put('/hubba/api/resources/'+id, {
                type: 'email',
                configuration: {
                    "host": "test",
                    "port": 465,
                    "ssl": true,
                    "username":"test",
                    "password":"test"
                }
            }, function(err, req, res, data) {
                assert.ifError(err);
                id = data.id;
                assert.equal(data.configuration.host,'test');
                assert.equal(data.configuration.port,465);
                assert.equal(data.configuration.ssl,true);
                assert.equal(data.configuration.username,'test');
                assert.equal(data.configuration.password,'');
                done();
            });

        });

        it('should update to be a usable email resource', function(done) {

            client.put('/hubba/api/resources/'+id, {
                configuration: {
                    "host": "smtp.gmail.com",
                    "port": 465,
                    "ssl": true,
                    "username":"testhubba@gmail.com",
                    "password":"hubbahubba"
                }
            }, function(err, req, res, data) {
                assert.ifError(err);
                id = data.id;
                assert.equal('smtp.gmail.com',data.configuration.host);
                assert.equal(465,data.configuration.port);
                assert.equal(true,data.configuration.ssl);
                assert.equal('testhubba@gmail.com',data.configuration.username);
                assert.equal('',data.configuration.password);
                done();
            });

        });


        it('should successfully send an email.', function(done) {
            this.timeout(5000);
            client.post('/api/test', {
                from: "testhubba@gmail.com",
                to: "testhubba@gmail.com",
                subject: "Hello world!",
                text: "Plaintext body",
                html: "<h1>Big HTML body!</h1>"
            }, function(err, req, res, data) {
                assert.ifError(err);
                done();
            });

        });


        it('DELETE /hubba/api/resources should delete "email_resource_test" return a 200 response.', function(done) {
            client.del('/hubba/api/resources/'+id, function(err, req, res, data) {
                assert.ifError(err);
                done();
            });
        });
    });
});