var assert = require('assert-plus');

function PassportRouter (opts){
    var o = opts || {};

    assert.object(o.passport,'passport');
    assert.object(o.passport,'clientFactory');

    this._passport = o.passport;
    this._clientFactory = o.clientFactory;
    this._authenticatorsHash = {}; //{ authenticatorName : { successRedirect:... , failureRedirect }, ... }
}

PassportRouter.prototype.update = function PassportRouterUpdate(opts) {
    var o = opts || {};

    assert.string(o.name,'name');
    this._remove(o);
    if (o.authenticateFunc) {
        this._add(o);
    }
};

PassportRouter.prototype._add = function PassportRouterAdd(o) {
    var self = this;

    this._authenticatorsHash[o.name] = o;
    this._passport.use(o.name,new o.strategy(
        o.configuration,
        function(req) {
            var a = [],
                client = self._clientFactory.createClient(req,{});

            req.isAuthenticated = function(){
                return true;
            };

            for (var i in arguments) {
                a.push(arguments[i]);
            }

            a.push(client);
            o.authenticateFunc.apply(this, a);
        }
    ));
};

PassportRouter.prototype._remove = function PassportRouterRemove(o) {
    delete this._passport.unuse(o.name);
    delete this._authenticatorsHash[o.name];
};

PassportRouter.prototype.authenticate = function authenticateDef(name) {
    return this._passport.authenticate(name, {
        successRedirect: this._authenticatorsHash[name].successRedirect,  // could be null and that's a-okay
        failureRedirect: this._authenticatorsHash[name].failureRedirect  // could be null and that's a-okay
    });
};


exports.PassportRouter = PassportRouter;