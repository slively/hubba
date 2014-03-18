var assert = require('assert-plus'),
    vm = require('vm');

/*
    This class is responsible for updating the server socket routes during runtime.
    It is called when the server detects a change in the socketList.
 */
function SocketRouter (opts,mocks){
    var o = opts || {};

    assert.notEqual(o.server,undefined,'server');
    assert.notEqual(o.server.io,undefined,'server.io');
    assert.object(o.server.io.router,'server.io.router');
    assert.object(o.clientFactory,'clientFactory')
    assert.object(o.logger,'Hubba Logger');
    assert.func(o.logger.log,'Hubba Logger .log function');

    this._server = o.server;
    this._store = {};
    this._runMethods = {};
    this._clientFactory = o.clientFactory;
    this._logger = o.logger;
    //this._context = vm.createContext({ console: console, hubba: {} });
}

SocketRouter.prototype.updateRoute = function updateRoute(o) {
    this.removeRoute(o);
    this.addRoute(o);
};

SocketRouter.prototype.removeRoute = function removeRoute(o) {
    for ( var key in o.methods ) {
        if (o.methods[key] === 'default') {
            delete this._server.io.router[o.name];
        } else {
            delete this._server.io.router[o.name+':'+key];
        }
    }
};

SocketRouter.prototype.addRoute = function addRoute(o) {
    var self = this,
        route;

    this._runMethods[o.name] = {};

    for ( var key in o._compiledMethods ) {

        this._runMethods[o.name][key] = o._compiledMethods[key].runInThisContext();

        if (key === 'default') {
            route = o.name;
        } else {
            route = o.name+':'+key;
        }

        this._server.io.route(route, function(req){
            try {
                self._runMethods[o.name][key](self._clientFactory.createClient(req));
                self._logger.log({
                    socket: {
                        id: req.socket.id
                    },
                    data: req.data,
                    sessionId: req.sessionID,
                    headers: req.headers,
                    cookies: req.cookies
                });
            } catch(e){
                req.io.emit('error',{
                    message: e.message,
                    stack: e.stack
                });
            }
        });
    }
};

exports.SocketRouter = SocketRouter;