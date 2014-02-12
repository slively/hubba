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
    assert.object(o.internalClient,'internalClient');

    this.server = o.server;
    this.store = {};
    this.internalClient = o.internalClient;
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
        this._addRoute(o);
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

    verbs.forEach(function(verb){
        self.server[verb](opts.path, function(req,res){
            try {
                opts.http[verb.toUpperCase()](req,res,self.internalClient);
            } catch(err){
                console.log(verb + ' error: ' + err + ':\n' + err.stack + '\n' + 'Params: ' + JSON.stringify(req.params) + '\n' + 'Body: ' + JSON.stringify(req.body) + '\n\n');
                if(!res.headerSent){
                    res.send(500,err);
                }
            }
        });
    });
    this.store[opts.id] = opts.path;
};

exports.DynamicRouter = DynamicRouter;
