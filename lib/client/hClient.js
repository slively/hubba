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

        get(path,config)
        post(path,body,config)
        put(path,body,config)
        patch(path,body,config)
        del(path,config)
        log(level,msg,metaDataObject)
        join(promise1,...)

    hubba client promises:

        then(successcb,errcb)
        success(data) or done(data)
        error(err) or fail(err) or catch(err)
        finally(data|err) or ensure(data|err)

 */

var url = require('url'),
    fs = require('fs'),
    assert = require('assert-plus'),
    rHClientRequest = require('./hClientRequest').HClientRequest,
    rHClientResponse = require('./hClientResponse').HClientResponse,
    when = require('when');

function HClient(opts, m){

    var self = this,
        o = opts || {},
        mocks = m || {},
        HClientRequest = mocks.HClientRequest || rHClientRequest,
        HClientResponse = mocks.HClientResponse || rHClientResponse;

    assert.object(o.logger,'Hubba Logger');
    assert.func(o.logger.log,'Hubba Logger log function');

    this.log = o.logger.log;
    this.internalClient = {};
    this.routes = {};

    // wrap the resource handler in a function that will
    //  stub out the req, res objects usually passed from restify
    //  as internal req,res objects and return a promise.
    function iHandler(verb){

        return function(path,body,config){

            if (verb === "GET" || verb === "DELETE" && body){
                config = body;
                body = undefined;
            }

            var deferred = when.defer(),
                v = verb,
                iReq = new HClientRequest({
                    verb: v,
                    path: path,
                    body: body,
                    config: config
                }),
                iRes = new HClientResponse({
                    resolver: deferred,
                    logger: o.logger,
                    req: iReq
                }),
                routeHandler,
                clientPromise = {
                    then: function(cb,ecb){
                        if (!cb && !ecb){
                            throw 'Hubba api promises require a callback. (then promise)'
                        }
                        deferred.promise.then(function(obj){
                            if (cb){
                                cb(obj.body,obj.code,obj.config);
                            }
                        },function(obj){
                            if (ecb){
                                ecb(obj.body,obj.code,obj.config);
                            }
                        });
                        return clientPromise;
                    },
                    success: function(cb){
                        if (!cb){
                            throw 'Hubba api promises require a callback. (success/done promise)'
                        }
                        deferred.promise.then(function(obj){
                            cb(obj.body,obj.code,obj.config);
                        });
                        return clientPromise;
                    },
                    error:function(cb){
                        if (!cb){
                            throw 'Hubba api promises require a callback. (error/fail promise)'
                        }
                        deferred.promise.catch(function(obj){
                            cb(obj.body,obj.code,obj.config);
                        });
                        return clientPromise;
                    },
                    ensure:function(cb){
                        if (!cb){
                            throw 'Hubba api promises require a callback. (ensure/finally promise)'
                        }
                        deferred.promise.ensure(function(obj){
                            var o = obj || {};
                            cb(o.body,o.code,o.config);
                        });
                        return clientPromise;
                    }
                }

            // promise aliases because pandering is easier than agreeing.
            clientPromise.done = clientPromise.success;
            clientPromise.fail = clientPromise.catch = clientPromise.error;
            clientPromise.finally = clientPromise.ensure;

            for (var id in self.routes){
                if( path.match(self.routes[id].regexp ) ){
                    routeHandler = self.routes[id].http[v];
                }
            }

            process.nextTick(function callInteralHandler(){
                if (routeHandler){
                    try {
                        routeHandler(iReq,iRes);
                    } catch(e) {
                        iRes.send(500, e);
                    }
                } else {
                    iRes.send(404, new Error('Could not find route handler for '+verb+': ' + path));
                }

            });

            return clientPromise;
        };
    };
/*
    function joinPromise(){
        for ( var i = 0; i < arguments.length; i++ ){
            arguments[i].then(joinResolve,joinReject);
        }

        var deferred = when.defer(),
            resolveCnt = arguments.length,
            resolveData = [],
            rejected = false;

        function joinResolve(body,code,config){console.log('resolved');
            if(!rejected){
                resolveData.push({body:body,code:code,config:config});
                resolveCnt--;
                if (resolveCnt == 0){
                    deferred.resolve(resolveData);
                }
            }
        };

        function joinReject(body,code,config){console.log('rejected');
            rejected = true;
            deferred.reject({body:body,code:code,config:config});
        };



        var    p = {
                success: function(cb){
                    deferred.promise.then(cb);
                    return p;
                },
                error: function(ecb){console.log('err?');
                    deferred.promise.catch(ecb);
                    return p;
                },
                ensure: function(cb){
                    deferred.promise.ensure(cb);
                    return p;
                }
            },
            args = arguments;

        p.done = p.success;
        p.catch = p.fail = p.error;
        p.finally = p.ensure;



        return p;
    };*/

    this.internalClient = {
        get: iHandler('GET'),
        post: iHandler('POST'),
        put: iHandler('PUT'),
        patch: iHandler('PATCH'),
        del: iHandler('DELETE'),
        log: function(msg){
            o.logger.log(msg);
        }
    };

};

HClient.prototype.updateRoute = function HClientUpdateRoute(resource,regexp){
    this.routes[resource.id] = {
        regexp: regexp,
        http: resource.http
    };

    return this;
};

HClient.prototype.deleteRoute = function HClientDeleteRoute(resource){
    delete this.routes[resource.id];
    return this;
};

exports.HClient = HClient;