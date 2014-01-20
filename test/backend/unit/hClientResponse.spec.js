"use strict";

var assert = require('assert-plus'),
    when = require('when'),
    HClientResponse = require("../../../lib/client/HClientResponse").HClientResponse;

describe('HClientResponse',function(){

    it('should instantiate successfully without any parameters.',function(){
        var r = new HClientResponse();
        assert.func(r.send);
        assert.func(r.header);
        assert.func(r.cache);
        assert.throws(function(){
            r.send();
        });
    });

    it('should resolve the deferred promise for no status code.',function(done){
        this.timeout(100);
        var d = when.defer(),
            res = new HClientResponse(d.resolver);

        d.promise.then(function success(obj){
            assert.equal(obj.body,"hello world");
            done();
        });

        res.send("hello world");
    });

    it('should resolve the deferred promise for statusCode == 200.',function(done){
        this.timeout(100);
        var d = when.defer(),
            res = new HClientResponse(d.resolver);

        d.promise.then(function success(obj){
            assert.equal(obj.body,"hello world");
            done();
        });

        res.send(200,"hello world");
    });

    it('should reject the deferred promise for statusCode >= 400.',function(done){
        this.timeout(100);
        var d = when.defer(),
            res = new HClientResponse(d.resolver);

        d.promise.catch(function error(obj){
            assert.equal(obj.body,"hello error");
            done();
        });

        res.send(400,"hello error");
    });

    it('should reject the deferred promise when data is an instance of Error and statusCode >= 400.',function(done){
        this.timeout(100);
        var d = when.defer(),
            res = new HClientResponse(d.resolver),
            err = new Error("hello error");

        d.promise.catch(function error(obj){
            assert.ok(obj.body instanceof Error);
            assert.equal(500,obj.body.statusCode);
            assert.equal(500,obj.code);
            done();
        });

        res.send(500,err);
    });

});