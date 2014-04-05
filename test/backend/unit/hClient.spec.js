"use strict";

var assert= require('assert-plus'),
    HClient = require("../../../lib/client/hClient").HClient;

describe('HClient', function(){

    var client;

    it('should instantiate successfully without options.',function(){
        client = new HClient();
        assert.func(client.updateRoute);
        assert.func(client.deleteRoute);
        assert.object(client.internalClient);
        assert.func(client.internalClient.get);
        assert.func(client.internalClient.post);
        assert.func(client.internalClient.put);
        assert.func(client.internalClient.patch);
        assert.func(client.internalClient.del);
    });

    describe('internal client',function(){
        it('should have all of the relevant objects and functions from the configuration.',function(){
            client.updateRoute({
                "id":1,
                "path":"/api",
                "http": {
                    GET: function(req,res){res.send({})},
                    POST: function(req,res){res.send(404)},
                    PUT: function(req,res){res.send(500)},
                    PATCH: function(req,res){res.send('testing')},
                    DELETE: function(req,res){res.send(200)}
                }
            });

        });

        it('/api should have a working HTTP GET handler.',function(done){
            this.timeout(100);
            client.internalClient.get('/api').then(function(result,code,cfg){
                assert.object(result);
                done();
            });
        });

        it('/api should have a working HTTP POST handler.',function(done){
            this.timeout(100);
            client.internalClient.post('/api').catch(function(result,code,cfg){
                // fyi this will timeout if the assertion is no satisfied.
                //  for some reason I am not seeing an error.
                assert.equal(code,404);
                done();
            });
        });

        it('/api should have a working HTTP PUT handler.',function(done){
            this.timeout(100);
            client.internalClient.put('/api').catch(function(result,code,cfg){
                assert.equal(code,500);
                done();
            });
        });

        it('/api should have a working HTTP PATCH handler.',function(done){
            this.timeout(100);
            client.internalClient.patch('/api').then(function(result,code){
                assert.equal('testing',result);
                assert.equal(200,code);
                done();
            });
        });

        it('/api should have a working HTTP DELETE handler.',function(done){
            this.timeout(100);

            client.internalClient.del('/api').then(function(result,code){
                assert.equal(200,code);
                done();
            });
        });

    })

});
