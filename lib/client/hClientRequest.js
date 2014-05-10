"use strict";

/*

 INPUT:
    nothing or express req object

 OUTPUT:
     internal request object which will stub out a express request for internal use


    All of these properties and method should be fully implemented at some point:

    METHODS
     header(key, [defaultValue])
     accepts(type)
     is(type)
     getLogger(component)

    PROPERTIES
     contentLength	Number	    short hand for the header content-length
     contentType	String	    short hand for the header content-type
     href	        String	    url.parse(req.url) href
     log	        Object	    bunyan logger you can piggyback on
     id	            String	    A unique request id (x-request-id)
     path	        String	    cleaned up URL path
     query	        String	    the query string only
     secure	        Boolean	    Whether this was an SSL request
     time	        Number	    the time when this request arrived (ms since epoch)

 */

var url = require('url');
    //uuid = require('node-uuid');


function HClientRequest(opts){
    var o = opts || {},
        p = o.path || '',
        u = url.parse(p,true),
        c = o.config || {},
        q = c.query || {},
        req = o.req || {};

    for ( var key in u.query ){
        q[key] = u.query[key];
    }

    this.id = o.id;
    this.contentLength= 0;
    this.contentType= c.contentType || 'application/json';
    this.body = o.body || {};
    this.href= u.href;
    this.path= u.path;
    this.query= q;
    this.secure= true;
    this.time= 0;
    this.internal= true;
    this.headers = c.headers || {};
    this.method = o.method.toUpperCase();
    this.session = req.session;
    this.internal = true;
    this.user = req.user;
    this.isAuthenticated = req.isAuthenticated;
}

HClientRequest.prototype.accepts = function (type){
    return type === 'application/json';
};

HClientRequest.prototype.is = function (type){
    return type === 'application/json';
};

HClientRequest.prototype.getLogger = function HClientRequestGetLogger(){
    return this.log;
};

exports.HClientRequest = HClientRequest;