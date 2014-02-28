"use strict";

/*

    Internal response object use by hClient.
    See: https://github.com/visionmedia/express/blob/master/lib/response.js

 */

var expressRes = require('../../node_modules/express/lib/response.js'),
    http = require('http'),
    Stream = require('stream'),
    util = require('util'),
    iHeader = function(){return this;},
    iCache = iHeader,
    assert = require('assert-plus');

var HClientResponse = function HClientResponseDefinition(opts){
    var o = opts || {};

    Stream.call(this);

    assert.object(o.resolver);
    assert.object(o.logger);
    assert.func(o.logger.log);
    assert.object(o.req);

    this.req = o.req;
    this.resolver = o.resolver;
    this.log = function(msg){
        o.logger.log(msg);
    };
    this.writable = true;
    this.bodyBuffer = '';
};

//HClientResponse.__proto__ = http.ServerResponse.prototype;
util.inherits(HClientResponse, Stream);

HClientResponse.prototype.send = function iSend(code,b,config){
    var body = b || null,
        cfg = config || {};

    // copy of Restify code from /lib/response.js
    if (code === undefined) {
        code = 200;
    } else if (code.constructor.name === 'Number') {
        if (body instanceof Error) {
            body = {
                message : body.message,
                stack: body.stack
            };
        }
    } else {
        cfg = body || {};
        body = code || {};
        code = 200;
    }

    // resolve promise unless error code >= 400 or data is an Error object, then reject
    if (code >= 400){
        this.resolver.reject({body:body,code:code,config:config});
    } else {
        this.resolver.resolve({body:body,code:code,config:config});
    }

    this.log({
        req: this.req,
        res: {
            body: body,
            headers: cfg.headers ||{},
            statusCode: code
        }
    });
};

HClientResponse.prototype.header = iHeader;
HClientResponse.prototype.cache = iCache;

HClientResponse.prototype.write = function(chunk){
    this.bodyBuffer += chunk;
};

HClientResponse.prototype.end = function(chunk){
    var j;
    if (chunk) s.write(chunk);
    this.writable = false;
    try {
        j = JSON.parse(this.bodyBuffer);
    } catch(e){
        j = this.bodyBuffer
    }
    delete this.bodyBuffer;
    this.send(j);
};

HClientResponse.prototype.destroy = function(){
    delete this.bodyBuffer;
    this.writable = false;
};

exports.HClientResponse = HClientResponse;