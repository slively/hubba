var assert = require('assert-plus'),
    _ = require('lodash'),
    vm = require('vm');

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
    o.configuration.statless = true;
    this._authenticatorsHash[o.name] = o;
    this._passport.use(o.name,new o.strategy(
        o.configuration,
        function(req) {
            var a = [],
                client = routerSelf._clientFactory.createClient(req,{}),
                originalDone,
                self = this;

            // technically the session attempts to deserialize the user first,
            //  but it makes more sense for the log to show this as the initial
            //  request.
            req.initial = true;
            req.internal = false;

            for (var i in arguments) {
                a.push(arguments[i]);
            }

            originalDone = a[a.length-1];
            a[a.length-1] = function passportRouterDoneDef(err,user){
                originalDone.apply(self,arguments);

                routerSelf._logger.log({
                    req: transformReq(req),
                    res: {
                        statusCode: 200,
                        body: user
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
    return this._passport.authenticate(name);
};

// this throws errors that need to be caught
PassportRouter.prototype.updateSerializers = function updateSerializers(serializeFuncString) {
    var routerSelf = this,
        ctx = vm.createContext(),
        serializeFunc = vm.runInContext('f = function(user, req, done, hubba){' + serializeFuncString + '};', ctx);

    this._passport._serializers = [];
    this._passport.serializeUser(function(req,user,done) {
        try {
            serializeFunc(user, req, function(err, serializedUser) {
                done(err, serializedUser);

            }, routerSelf._clientFactory.createClient(req));
        } catch(e) {
            var err = new Error('Failed to serialize user: ' + e.message);
            done(err);
        }
    });
};

// this throws errors that need to be caught
PassportRouter.prototype.updateDeserializers = function updateSerializers(deserializeFuncString) {
    var routerSelf = this,
        ctx = vm.createContext(),
        deserializeFunc = vm.runInContext('f = function(sessionData, req, done, hubba){' + deserializeFuncString + '};', ctx);

    this._passport._deserializers = [];
    this._passport.deserializeUser(function(req,sessionData,done) {

        // set this as calls are made to deserialize user so
        //  we can identify service calls as being part
        //  of the auth flow.
        req.deserializingUser = true;

        // technically this happens first, but it's more of
        //  of an internal request.
        req.initial = false;
        req.internal = true;

        try {
            deserializeFunc(sessionData, req, function doneProxyDef(err, desereializedUser){
                routerSelf._logger.log({
                    message: 'deserialize user',
                    err: err,
                    deserializedUser: desereializedUser,
                    req: transformReq (req)
                });
                done(err, desereializedUser);
                delete req.deserializingUser; // remove this so the rest of the requests don't use it
            }, routerSelf._clientFactory.createClient(req));
        } catch(e) {
            var err = new Error('Failed to de-serialize user: ' + e.message);
            done(err);
        }
    });
};

function transformReq(req) {

    var body = _.cloneDeep(req.body) || {};

    body.username = (body.username) ? '*REDACTED*' : undefined;
    body.password = (body.password) ? '*REDACTED*' : undefined;

    return {
        id : req.id,
        initial: req.initial || false,
        internal: req.internal,
        authenticated: req.isAuthenticated(),
        headers : req.headers,
        method: req.method || 'POST',
        params     : req.params,
        query      : req.query,
        body       : body,
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
        originalUrl: req.originalUrl,
        deserializingUser: req.deserializingUser,
        serializeUser: req.serializeUser
    }
}

exports.PassportRouter = PassportRouter;