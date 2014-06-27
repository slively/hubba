var assert = require('assert-plus'),
    util = require("util"),
    EventEmitter = require("events").EventEmitter,
    ServerConfiguration = require('./serverConfiguration').ServerConfiguration;

function ServerConfigurator(opts) {
    EventEmitter.call(this);
    var o = opts || {};
    assert.object(o.store,'store');
    this._store = o.store;
}
util.inherits(ServerConfigurator, EventEmitter);

ServerConfigurator.prototype.findAll = function(cb){
    this._store.findAll(function configurationResponseFunction(err,result){
        var items = result || [],
            configsJson = {},
            errs = [];

        items.forEach(function(config) {
            try {
                var c = (new ServerConfiguration(config)).toJSON();
                configsJson[c.key] = c.value;
            } catch(e) {
                errs.push(e.message);
            }
        });

        if (errs.length) {
            var returnedError = new Error(errs.join(', '));
            returnedError.status = 500;
            cb(returnedError);
        } else {
            cb(err, configsJson);
        }
    });
};

ServerConfigurator.prototype.find = function(key,cb){
    this._store.find(key, function configurationFindResponseFunc(err, result) {
        if (err) {
            err.status = 500;
            cb(err)
        } else if (result === undefined) {
            var e = new Error('Server Configuration with key ' + key + ' not found.');
            e.status = 404;
            cb(e);
        } else {
            try {
                cb(null,(new ServerConfiguration(result)).toJSON());
            } catch(e) {
                e.status = 500;
                cb(e);
            }
        }
    })
};

ServerConfigurator.prototype.update = function(newConfigItem,cb){
    var self = this,
        serverConfig;

    try {
        serverConfig = new ServerConfiguration(newConfigItem);
    } catch(e) {
        e.status = 400;
        cb(e);
        return;
    }

    this._store.update(serverConfig, function configurationResponseFunction(err){
        if (err){
            err.status = 400;
            cb(err);
        } else {
            var serverConfigJSON = serverConfig.toJSON();
            try {
                self.emit('update:'+serverConfigJSON.key, serverConfigJSON.value);
            } catch(e) {
                e.status = 500;
                cb(e);
                return;
            }
            cb(null,serverConfigJSON);
        }
    });
};

//ServerConfigurator.prototype.add = function(){};
//ServerConfigurator.prototype.del = function(){};

exports.ServerConfigurator = ServerConfigurator;