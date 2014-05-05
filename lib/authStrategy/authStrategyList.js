var assert = require('assert-plus'),
    util = require("util"),
    EventEmitter = require("events").EventEmitter,
    AuthStrategyLoader = require('./authStrategyLoader').AuthStrategyLoader;

// Responsibilities:
//  Validate added/updated AuthStrategy models
//  Emit all add/update/remove events so passportjs can be updated

// Input
//  store: instantiated AuthStrategyStore

function AuthStrategyList(opts){
    var o = opts || {},
        self = this;

    EventEmitter.call(this);
    assert.object(o.store);
    self._store = o.store;
    self._factories = new AuthStrategyLoader();

    self._store.findAll(function initializeAuthStrategies(err,result){
        if(err) {
            console.log('Critical Error initializing AuthStrategies list: ');
            console.log(err.stack);
            return;
        }

        result.forEach(function(strategy){
            try {
                self.emit('add',self._factories[strategy.type].bundleStrategyForPassport(strategy));
            } catch(e) {
                console.log('Critical Error initializing auth strategy \"'+ JSON.stringify(strategy) + '\" from the database. Will likely need to manually update in database:');
                console.log(e.stack);
            }
        });
    });
}
util.inherits(AuthStrategyList, EventEmitter);

AuthStrategyList.prototype.find = function AuthStrategyListFind(id,cb){
    var self = this;

    self._store.find(id,cb);
    return this;
};

AuthStrategyList.prototype.findAll = function AuthStrategyListFindAll(cb){
    var self = this;

    self._store.findAll(cb);

    return this;
};

AuthStrategyList.prototype.add = function AuthStrategyListAdd(strategy,cb){
    var self = this,
        passportStrategy;

    strategy.configuration = strategy.configuration || {};
    try {
        assert.object(strategy.configuration,'Configuration');
        passportStrategy = self._factories[strategy.type].bundleStrategyForPassport(strategy);
        strategy.configuration = JSON.stringify(strategy.configuration);
    } catch(e) {
        cb(e);
        return this;
    }

    self._store.add(strategy,function(err,id){
        if(err) {
            cb(err);
            return;
        }
        try {
            strategy = {
                id: id,
                name: strategy.name,
                type: strategy.type,
                configuration: JSON.parse(strategy.configuration || {}),
                code: strategy.code
            };
        } catch (e) {
            cb(e);
            return;
        }

        self.emit('add',passportStrategy);
        cb(undefined,strategy);
    });

    return this;
};

AuthStrategyList.prototype.update = function AuthStrategyListUpdate(id,strategy,cb){

    var self = this,
        passportStrategy;

    strategy.id = id; // just in case
    strategy.configuration = strategy.configuration || {};

    try {
        assert.object(strategy.configuration,'Configuration');
        passportStrategy = self._factories[strategy.type].bundleStrategyForPassport(strategy);
        strategy.configuration = JSON.stringify(strategy.configuration);
    } catch(e) {
        cb(e);
        return this;
    }

    // update the database
    self._store.replace(strategy, function(err){
        if(err) {
            cb(err);
            return;
        }

        strategy.configuration = JSON.parse(strategy.configuration);
        self.emit('update',passportStrategy);
        cb(undefined,strategy);
    });

    return this;
};

AuthStrategyList.prototype.remove = function AuthStrategyListRemove(id,cb){

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

//find version

exports.AuthStrategyList = AuthStrategyList;