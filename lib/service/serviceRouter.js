/*
 This class gives an api to add/remove routes to/from express for each resource during runtime.
 */
var assert = require('assert-plus'),
    verbs = ['get','post','put','patch','delete'];

function ServiceRouter (opts){
    // hash of resource id : path
    var o = opts || {};

    assert.notEqual(o.server,undefined,'server');
    assert.object(o.server.routes,'server.routes');
    assert.object(o.clientFactory,'clientFactory');
    assert.object(o.logger,'logger');

    this.server = o.server;
    this.logger = o.logger;
    this._clientFactory = o.clientFactory;
}

// remove old route by id, add new route to express and internal storage
// if path === undefined then it will just be removed
ServiceRouter.prototype.updateRoute = function updateRoute(opts) {
    var o = opts || {};

    assert.number(o.id,undefined);
    this._removeRoute(o);

    if (o.path){
        assert.object(o.http,'http');
        assert.func(o.http.GET,'http.GET');
        assert.func(o.http.POST,'http.POST');
        assert.func(o.http.PUT,'http.PUT');
        assert.func(o.http.PATCH,'http.PATCH');
        assert.func(o.http.DELETE,'http.DELETE');
        return this._addRoute(o);
    }
};

// remove route from internal storage and express based on resource id
ServiceRouter.prototype._removeRoute = function _removeRoute(opts) {
    var self = this;

    verbs.forEach(function(verb){
        for (var i = 0; i < self.server.routes[verb].length; i++){
            if (self.server.routes[verb][i].id && self.server.routes[verb][i].id === opts.id) {
                self.server.routes[verb].splice(i,1);
            }
        }
    });
};

// add route to internal storage and express based on resource id and new path
ServiceRouter.prototype._addRoute = function _addRoute(opts) {
    var self = this;

    verbs.forEach(function(verb){
        self.server[verb]('/api' + opts.path, function(req,res,next){
            var oldSend = res.send,
                oldJson = res.json,
                logged = false,
                logData;

            res.json = function ServiceRouterResponseJson() {
                res._hubbaLogged = true;

                oldJson.apply(res,arguments);

                var b = '';

                if (arguments.length === 1 && arguments[0] != res.statusCode){
                    b = arguments[0];
                } else if (arguments.length === 2){
                    b = arguments[1];
                }

                self.logger.log({
                    req: transformReq(req),
                    res: transformRes(res,b)
                });
            };

            res._hubbaLogged = false;

            res.send = function ServiceRouterResponseSend() {
                var b = '';

                if (arguments.length === 1 && arguments[0] != res.statusCode){
                    b = arguments[0];
                } else if (arguments.length === 2){
                    b = arguments[1];
                }

                if (b instanceof Error){
                    oldSend.apply(res,[500,{
                        message: b.message,
                        stack: b.stack
                    }]);
                } else {
                    oldSend.apply(res,arguments);
                }

                if(!res._hubbaLogged){
                    res._hubbaLogged = true;
                    self.logger.log({
                        req: transformReq(req),
                        res: transformRes(res,b)
                    });
                }
            };

            try {
                opts.http[req.method.toUpperCase()](req,res,next,self._clientFactory.createClient(req,res));
            } catch(err){
                self.logger.log(req.method + ' error: ' + err + ':\n' + err.stack + '\n' + 'Params: ' + JSON.stringify(req.params) + '\n' + 'Body: ' + JSON.stringify(req.body) + '\n\n');
                if(!res.headerSent){
                    res.send(500,{
                        message: err.message,
                        stack: err.stack
                    });
                }
            }
        });


        var newRoute,
            added = false;

        // find and remove the newly added route in the array
        for ( var i = 0; i < self.server.routes[verb].length; i++ ) {
            if (self.server.routes[verb][i].path === '/api' + opts.path) {
                newRoute = self.server.routes[verb].splice(i,1)[0];
                break;
            }
        }

        newRoute.id = opts.id;
        newRoute.seq = opts.seq;

        for ( var i = 0; i < self.server.routes[verb].length; i++ ) {

            // the new route is at the end of the list, pop it from the end and insert it at the correct location.
            if (typeof self.server.routes[verb][i].seq !== undefined) {

                // if a duplicate sequence, update every sequence after this one
                if (self.server.routes[verb][i].seq === opts.seq) {

                    for ( var j = i; j < self.server.routes[verb].length; j++ ) {
                        if (typeof self.server.routes[verb][j].seq !== undefined) {
                            self.server.routes[verb][j].seq++;
                        }
                    }

                }

                // insert into appropriate space
                if (self.server.routes[verb][i].seq >= opts.seq) {
                    self.server.routes[verb].splice(i, 0, newRoute);
                    added = true;
                    break;
                }
            }
        }

        // it belongs at the end
        if (!added) {
            self.server.routes[verb].push(newRoute);
        }
    });

    return this;
};

function transformReq(req){
    return {
        id : req.id,
        initial: req.initial || false,
        internal: req.internal,
        authenticated: req.isAuthenticated(),
        headers : req.headers,
        method: req.method,
        params     : req.params,
        query      : req.query,
        body       : req.body,
        files      : req.files,
        route      : req.route,
        cookies    : req.cookies,
        signedCookies : req.signedCookies,
        ip         : req.ip,
        ips        : req.ips,
        path       : req.path,
        host       : req.host,
        fresh      : req.fresh,
        stale      : req.stale,
        xhr        : req.xhr,
        protocol   : req.protocol,
        secure     : req.secure,
        subdomains : req.subdomains,
        originalUrl: req.originalUrl
    }
}

function transformRes(res,body){
    return {
        headers: res._headers,
        statusCode: res.statusCode,
        body:body
    }
}

exports.ServiceRouter = ServiceRouter;