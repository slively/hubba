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

/*
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
    this._server = o.server;

    // wrap the resource handler in a function that will
    //  stub out the req, res objects usually passed from express
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
                };

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
    };

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
 */

function HubbaClientFactory(opts) {
    var o = opts || {};

    this._server = o.server;
    this._logger = o.logger || console;
}

HubbaClientFactory.prototype.createClient = function HClientCreateClient(req,res) {
    return new HubbaClient(this._server,this._logger,req,res);
};

function HubbaClient(server,logger,req,res){
    this._logger = logger;
    this._server = server;
    this._req = req;
    this._res = res;
}

HubbaClient.prototype._checkSocketMethods = function(method) {
    if (this._req.io[method] === undefined) {
        throw new Error('Cannot call socket method ' + method + ' from a resource request. Only broadcast and broadCastAll can be used from a resource request.');
    }
};

HubbaClient.prototype.log = function() {this._logger.log.apply(this._logger,arguments); return this;};
HubbaClient.prototype.emit = function(event, body) {
    this._checkSocketMethods('emit');
    this._req.io.emit.apply(this._req.io,arguments);
    this._logger.log({
        req: {
            id: this._req.id,
            method: 'EMIT'
        },
        socket: {
            event: event,
            body: body
        }
    });
    return this;
};
HubbaClient.prototype.respond = function(body) {
    this._checkSocketMethods('respond');
    this._req.io.respond.apply(this._req.io,arguments);
    this._logger.log({
        req: {
            id: this._req.id,
            method: 'RESPOND'
        },
        socket: {
            body: body
        }
    });
    return this;
};
HubbaClient.prototype.broadcast = function(event, body) {
    this._req.io.broadcast.apply(this._req.io,arguments);
    this._logger.log({
        req: {
            id: this._req.id,
            method: 'BROADCAST'
        },
        socket: {
            event: event,
            body: body,
            broadcast: true
        }
    });
    return this;
};
HubbaClient.prototype.broadcastAll = function(event, body) {
    this._server.io.broadcast.apply(this._server.io,arguments);
    this._logger.log({
        req: {
            id: this._req.id,
            method: 'BROADCAST ALL'
        },
        socket: {
            event: event,
            body: body,
            broadcastAll: true
        }
    });
    return this;
};
HubbaClient.prototype.join = function(room) {
    this._checkSocketMethods('join');
    this._req.io.join.apply(this._req.io,arguments);
    this._logger.log({
        req: {
            id: this._req.id,
            method: 'JOIN'
        },
        socket: {
            room: room
        }
    });
    return this;
};
HubbaClient.prototype.leave = function(room) {
    this._checkSocketMethods('leave');
    this._req.io.leave.apply(this._req.io,arguments);
    this._logger.log({
        req: {
            id: this._req.id,
            method: 'LEAVE'
        },
        socket: {
            room: room
        }
    });
    return this;
};

/*
HubbaClient.prototype.room = {};
HubbaClient.prototype.room.broadcast = function(event, body) {
    this._checkSocketMethods('roomBroadCast');
    this._req.io.room.broadcast.apply(this._req.io,arguments);
    this._logger.log({
        req: {
            id: this._req.id
        },
        socket: {
            method: 'BROADCAST',
            event: event,
            body: body,
            roomBroadcast: true
        }
    });
    return this;
};
HubbaClient.prototype.room.broadcastAll = function(event, body) {
    this._checkSocketMethods('roomBroadcastAll');
    this._req.io.room.broadcast.apply(this._req.io,arguments);
    this._logger.log({
        req: {
            id: this._req.id
        },
        socket: {
            method: 'BROADCAST ALL',
            event: event,
            body: body,
            roomBroadcastAll: true
        }
    });
    return this;
};
*/


HubbaClient.prototype.get = resourceHandlerFactory('get');
HubbaClient.prototype.post = resourceHandlerFactory('post');
HubbaClient.prototype.put = resourceHandlerFactory('put');
HubbaClient.prototype.patch = resourceHandlerFactory('patch');
HubbaClient.prototype.del = resourceHandlerFactory('del');

function resourceHandlerFactory(method) {
    return function resourceHandler(path,config) {
        var deferred = when.defer(),
            iReq = new rHClientRequest({
                id: this._req.id,
                method: method,
                path: path,
                body: undefined,
                config: config,
                req: this._req
            }),
            iRes = new rHClientResponse({
                resolver: deferred,
                logger: this._logger,
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
            };

        // promise aliases because pandering is easier than agreeing.
        clientPromise.done = clientPromise.success;
        clientPromise.fail = clientPromise.catch = clientPromise.error;
        clientPromise.finally = clientPromise.ensure;

        for ( var i = 0; i < this._server.routes[method].length; i++ ) {
            if (path.match(this._server.routes[method][i].regexp)) {
                routeHandler = this._server.routes[method][i].callbacks[0];
                break;
            }
        }

        console.log(iReq);

        process.nextTick(function callInteralHandler(){
            if (routeHandler) {
                try {
                    routeHandler(iReq,iRes);
                } catch(e) {
                    iRes.send(500, e);
                }
            } else {
                iRes.send(404, new Error('Could not find route handler for '+method.toUpperCase()+': ' + path));
            }

        });

        return clientPromise;
    };
}

exports.HubbaClient = HubbaClient;
exports.HubbaClientFactory = HubbaClientFactory;