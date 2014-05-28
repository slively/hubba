var assert = require('assert-plus'),
    _ = require('lodash');

function PassportRouter (opts){
    var o = opts || {};

    assert.object(o.passport,'passport');
    assert.object(o.passport,'clientFactory');
    assert.object(o.logger,'logger');

    this._passport = o.passport;
    this._clientFactory = o.clientFactory;
    this._authenticatorsHash = {}; //{ authenticatorName : { successRedirect:... , failureRedirect }, ... }
    this._logger = o.logger;
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
    var routerSelf = this;

    this._authenticatorsHash[o.name] = o;
    this._passport.use(o.name,new o.strategy(
        o.configuration,
        function(req) {
            var a = [],
                client = routerSelf._clientFactory.createClient(req,{}),
                originalDone,
                self = this;

            req.isAuthenticated = function(){
                return true;
            };

            for (var i in arguments) {
                a.push(arguments[i]);
            }

            originalDone = a[a.length-1];
            a[a.length-1] = function passportRouterDoneDef(err,user){
                originalDone.apply(self,arguments);
                routerSelf._logger.log({
                    req: {
                        initial: true,
                        internal: false,
                        path: req.path
                    },
                    res: {
                        success: (!err && !!user)
                    }
                });
            };

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