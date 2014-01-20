"use strict";
/*
    The server instantiates a client API with an instantiated resourceTree.toJSON as the parameter.
    The server passes the client into the http handlers of the (controller) resources.

    getTree() is called to initialize the client.
    The clientAPI listens to the resource tree 'update:path' event to update accordingly.
    clientAPI has a toFile method used to server the api to the browser.

    ResourceType handlers will need the following pieces of data from both the internal and external clients:
        path
        headers
        params
        body
        next()
        log()

    hubba client methods:

        GET(path,config)
        POST(path,body,config)
        POST(path,body,config)
        POST(path,body,config)
        DELETE(path,config)

    hubba client promises:

        .all([promise1,...])
        .then(successcb,errcb)
        .success(data) or .done(data)
        .error(err) or .fail(err) or .catch(err)
        .finally(data|err) or .ensure(data|err)

 */

var url = require('url'),
    assert = require('assert-plus'),
    rHClientRequest = require('./hClientRequest').HClientRequest,
    rHClientResponse = require('./hClientResponse').HClientResponse,
    when = require('when');

function HClient(o, m){

    var self = this,
        opts = o || {},
        mocks = m || {},
        HClientRequest = mocks.HClientRequest || rHClientRequest,
        HClientResponse = mocks.HClientResponse || rHClientResponse;

    this.internalClient = {};
    this.externalClient = '';
    this.routes = {}; // { '/test' : { GET: function(req,res){...}, POST: ..., ... }, /^\/+test\/+([a-zA-Z0-9-_~\.%@]+)$/ : {...}, ... }

    // wrap the resource handler in a function that will
    //  stub out the req, res objects usually passed from restify
    //  as internal req,res objects and return a promise.
    function iHandler(verb){

        return function(path,body,config){
            var deferred = when.defer(),
                iReq = new HClientRequest(path,body,config),
                iRes = new HClientResponse(deferred.resolver),
                v = verb,
                routeHandler,
                clientPromise = {
                    then: function(cb,ecb){
                        deferred.promise.then(function(obj){
                            cb(obj.body,obj.code,obj.config);
                        },function(obj){
                            ecb(obj.body,obj.code,obj.config);
                        });
                        return clientPromise;
                    },
                    success: function(cb){
                        deferred.promise.then(function(obj){
                            cb(obj.body,obj.code,obj.config);
                        });
                        return clientPromise;
                    },
                    error:function(cb){
                        deferred.promise.catch(function(obj){
                            cb(obj.body,obj.code,obj.config);
                        });
                        return clientPromise;
                    },
                    ensure:function(cb){
                        deferred.promise.ensure(function(obj){
                            cb(obj.body,obj.code,obj.config);
                        });
                        return clientPromise;
                    }
                };

            // promise aliases because pandering is easier than agreeing.
            clientPromise.done = clientPromise.success;
            clientPromise.fail = clientPromise.catch = clientPromise.error;
            clientPromise.finally = clientPromise.ensure;

            if (self.routes[compileURL({path:path})]){
                routeHandler = self.routes[compileURL({path:path})][v];
            }

            process.nextTick(function callInteralHandler(){
                if (routeHandler){
                    routeHandler(iReq,iRes);
                } else {
                    iRes.send(404, new Error('Could not find route handler for '+verb+': ' + path));
                }
            });

            return clientPromise;
        };
    };

    this.internalClient.api = {
        GET: iHandler('GET'),
        POST: iHandler('POST'),
        PUT: iHandler('PUT'),
        PATCH: iHandler('PATCH'),
        DELETE: iHandler('DELETE')
    };

};

HClient.prototype.updateRoute = function HClientUpdateRoute(resource){
    // update existing route, or add new one
    var p = compileURL(resource);
    this.routes[p] = resource.http;
};

HClient.prototype.deleteRoute = function HClientDeleteRoute(resource){
    var p = compileURL(resource);
    delete this.routes[p];
};

// copy & paste from Restify!
function compileURL(options) {
    if (options.path instanceof RegExp)
        return (options.path);

    assert.string(options.path, 'path');

    var params = [];
    var pattern = '^';
    var re;
    var _url = url.parse(options.path).pathname;
    _url.split('/').forEach(function (frag) {
        if (frag.length <= 0)
            return (false);

        pattern += '\\/+';
        if (frag.charAt(0) === ':') {
            if (options.urlParamPattern) {
                pattern += '(' + options.urlParamPattern + ')';
            } else {
                // Strictly adhere to RFC3986
                pattern += '([a-zA-Z0-9-_~\\.%@]+)';
            }
            params.push(frag.slice(1));
        } else {
            pattern += frag;
        }

        return (true);
    });

    if (pattern === '^')
        pattern += '\\/';
    pattern += '$';

    re = new RegExp(pattern, options.flags);
    re.restifyParams = params;

    return (re);
};


function matchURL(re, req) {
    var i = 0;
    var result = re.exec(req.path);
    var params = {};

    if (!result)
        return (false);

    // This means the user original specified a regexp match, not a url
    // string like /:foo/:bar
    if (!re.restifyParams) {
        for (i = 1; i < result.length; i++)
            params[(i - 1)] = result[i];

        return (params);
    }

    // This was a static string, like /foo
    if (re.restifyParams.length === 0)
        return (params);

    // This was the "normal" case, of /foo/:id
    re.restifyParams.forEach(function (p) {
        if (++i < result.length)
            params[p] = decodeURIComponent(result[i]);
    });

    return (params);
};

exports.HClient = HClient;