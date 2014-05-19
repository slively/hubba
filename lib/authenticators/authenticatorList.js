var assert = require('assert-plus'),
    util = require("util"),
    _ = require('underscore'),
    EventEmitter = require("events").EventEmitter,
    AuthStrategyLoader = require('./authStrategyLoader').AuthStrategyLoader;

// Responsibilities:
//  Validate added/updated Authenticator models
//  Emit all add/update/remove events so passportjs can be updated

// Input
//  store: instantiated AuthenticatorStore

function AuthenticatorList(opts){
    var o = opts || {},
        self = this;

    EventEmitter.call(this);
    assert.object(o.store);
    self._store = o.store;
    self._factories = AuthStrategyLoader.loadFactoriesSync();

    self._store.findAll(function initializeAuthenticators(err,result){
        if(err) {
            console.log('Critical Error initializing Authenticator list: ');
            console.log(err.stack);
            return;
        }

        result.forEach(function(authenticator){
            try {
                self.emit('add',self._factories[authenticator.strategy].bundleAuthenticatorForPassport(authenticator));
            } catch(e) {
                console.log('Critical Error initializing auth authenticator \"'+ JSON.stringify(authenticator) + '\" from the database. Will likely need to manually update in database:');
                console.log(e.stack);
            }
        });
    });
}
util.inherits(AuthenticatorList, EventEmitter);

AuthenticatorList.prototype.find = function AuthenticatorListFind(id,cb){
    var self = this;

    self._store.find(id,cb);
    return this;
};

AuthenticatorList.prototype.findAll = function AuthenticatorListFindAll(cb){
    var self = this;

    self._store.findAll(cb);

    return this;
};

AuthenticatorList.prototype.add = function AuthenticatorListAdd(authenticator,cb){
    var self = this,
        passportAuthenticator;

    authenticator.configuration = authenticator.configuration || {};
    try {
        assert.object(authenticator.configuration,'Configuration');
        passportAuthenticator = self._factories[authenticator.strategy].bundleAuthenticatorForPassport(authenticator);
        authenticator.configuration = JSON.stringify(authenticator.configuration);
    } catch(e) {
        cb(e);
        return this;
    }

    self._store.add(authenticator,function(err,id){
        if(err) {
            cb(err);
            return;
        }
        try {
            authenticator = {
                id: id,
                name: authenticator.name,
                type: authenticator.strategy,
                configuration: JSON.parse(authenticator.configuration || {}),
                code: authenticator.code,
                successRedirect: authenticator.successRedirect || null,
                failureRedirect: authenticator.failureRedirect || null
            };
        } catch (e) {
            cb(e);
            return;
        }

        self.emit('add',passportAuthenticator);
        cb(undefined,authenticator);
    });

    return this;
};

AuthenticatorList.prototype.update = function AuthenticatorListUpdate(id,authenticator,cb){

    var self = this,
        passportAuthenticator;

    authenticator.id = id; // just in case
    authenticator.configuration = authenticator.configuration || {};

    try {
        assert.object(authenticator.configuration,'Configuration');
        passportAuthenticator = self._factories[authenticator.strategy].bundleAuthenticatorForPassport(authenticator);
        authenticator.configuration = JSON.stringify(authenticator.configuration);
    } catch(e) {
        cb(e);
        return this;
    }

    // update the database
    self._store.replace(authenticator, function(err){
        if(err) {
            cb(err);
            return;
        }

        authenticator.configuration = JSON.parse(authenticator.configuration);
        self.emit('update',passportAuthenticator);
        cb(undefined,authenticator);
    });

    return this;
};

AuthenticatorList.prototype.remove = function AuthenticatorListRemove(id,cb){

    var self = this;

    // update the database
    self._store.remove(id,function(err){
        if(err) {
            cb(err);
            return;
        }

        self.emit('remove', { id: id });
        cb();
    });

    return this;
};

AuthenticatorList.prototype.findStrategies = function AuthenticatorListFindStrategiesDef(cb) {
    try {
        cb(null,_.map(this._factories, function (f) {
            return f.toJSON()
        }));
    } catch(e) {
        cb(e);
    }

    return this;
};

//find version

exports.AuthenticatorList = AuthenticatorList;