/*
    This class gives an api to add/remove routes to/from express for each resource during runtime.
 */
var assert = require('assert-plus'),
    verbs = ['get','post','put','patch','delete'];

function DynamicRouter (opts,mocks){
    // hash of resource id : path
    var o = opts || {};

    assert.notEqual(o.server,undefined,'server');
    assert.object(o.server.routes,'server.routes');
    assert.object(o.internalClient,'internalClient')
    assert.object(o.logger,'Hubba Logger');

    this.server = o.server;
    this.store = {};
    this.internalClient = o.internalClient;
    this.logger = o.logger;
}

// remove old route by id, add new route to express and internal storage
// if path === undefined then it will just be removed
DynamicRouter.prototype.updateRoute = function updateRoute(opts) {
    var o = opts || {};

    assert.notEqual(o.id,undefined);
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
DynamicRouter.prototype._removeRoute = function _removeRoute(opts) {
    var self = this;

    verbs.forEach(function(verb){
        for (var i = 0; i < self.server.routes[verb].length; i++){
            if (self.server.routes[verb][i].path === self.store[opts.id]) {
                self.server.routes[verb].splice(i,1);
                break;
            }
        }
    });

    delete this.store[opts.id];
};

// add route to internal storage and express based on resource id and new path
DynamicRouter.prototype._addRoute = function _addRoute(opts) {
    var self = this;

    //verbs.forEach(function(verb){
        self.server['all'](opts.path, function(req,res){
            var oldSend = res.send,
                oldJson = res.json,
                logged = false,
                logData;

            res.json = function DynamicRouterResponseJson() {
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

            res.send = function DynamicRouterResponseSend() {
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

                if(!res._hubbaLogged){//typeof b === 'object' && b !== null){
                    res._hubbaLogged = true;
                    self.logger.log({
                        req: transformReq(req),
                        res: transformRes(res,b)
                    });
                }
            };

            try {
                opts.http[req.method.toUpperCase()](req,res,self.internalClient);
            } catch(err){
                self.logger.log(req.method + ' error: ' + err + ':\n' + err.stack + '\n' + 'Params: ' + JSON.stringify(req.params) + '\n' + 'Body: ' + JSON.stringify(req.body) + '\n\n');
                if(!res.headerSent){
                    res.send(500,{
                        message: err.message,
                        stack: err.stack
                    });
                }
            }
       // });
    });

    this.store[opts.id] = opts.path;
    return self.server.routes.get[self.server.routes.get.length-1].regexp;
};

function transformReq(req){
    return {
        headers : req.headers,
        params     : req.params     ,
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

exports.DynamicRouter = DynamicRouter;