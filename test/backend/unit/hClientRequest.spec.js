"use strict";

var assert= require('assert-plus'),
    HClientRequest = require("../../../lib/client/hClientRequest").HClientRequest;

describe('HClientRequest',function(){

   it('should instantiate successfully without any parameters.',function(){
       var r = new HClientRequest();
       assert.equal(r.contentLength,0);
       assert.equal(r.contentType,'application/json');
       assert.object(r.body);
       assert.equal(r.href,'');
       assert.equal(r.log,undefined);
       assert.equal(r.id,'internal-');
       assert.equal(r.path,null);
       assert.object(r.query);
       assert.equal(r.secure,true);
       assert.equal(r.time,0);
       assert.equal(r.internal,true);
       assert.equal(r.header('test'),undefined);
       assert.ok(r.accepts('application/json'));
       assert.ok(r.is('application/json'));
   });

    it('should instantiate successfully with parameters.',function(){
        var r = new HClientRequest('/test/1?q2=abc',{test:123},{headers:{test:321},params:{q:'def'}});
        assert.equal(r.contentLength,0);
        assert.equal(r.contentType,'application/json');
        assert.deepEqual(r.body,{test:123});
        assert.equal(r.href,'/test/1?q2=abc');
        assert.equal(r.path,'/test/1?q2=abc');
        assert.deepEqual(r.query,{q:'def',q2:'abc'});
        assert.equal(r.secure,true);
        assert.equal(r.time,0);
        assert.equal(r.internal,true);
        assert.equal(r.header('test'),321);
    });


    // test query string in both path and configuration

});