var DEFAULTS = require('./../serverConfiguration/serverConfiguration').ServerConfiguration.DEFAULTS,
    _ = require('lodash');

exports.Adapter = {
    name: 'serverConfigurations',
    connected: function configStoreConnected(d){
        var self = this,
            done = d || function(){};

        self._db.serialize(function() {
            self._db.run("CREATE TABLE IF NOT EXISTS server_configuration (key TEXT PRIMARY KEY, value TEXT);", function(err,r){
                if (err) {
                    console.warn(err);
                }
            });

            DEFAULTS.forEach(function(config){
                self._db.run('INSERT OR IGNORE INTO server_configuration (key,value) VALUES (?,?);',[config.key,config.value], function(err,r){
                    if (err) {
                        console.warn(err);
                    }
                });
            });

            done();
        });
    },
    findAll: function configStoreFindAll(cb){
        var self = this,
            obj = {};

        self._db.all('SELECT * from server_configuration;',function(err,result){
            cb(err,result);
        });
    },
    find: function configStoreFin(key,cb) {
        var self = this;

        self._db.all('select * from server_configuration where key = ?', [key], function(err,result){
            var r = result || [];
            cb(err,r[0]);
        });
    },
    add: function configStoreAdd(config,cb){
        var self = this,
            c = config || {};

        self._db.run('INSERT into server_configuration (key,value) VALUES(?,?);', [c.key, c.value], function(err) {
            cb(err,this.lastID);
        });
    },
    update: function configStoreUpdate(config,cb){
        var self = this,
            c = config || {};

        self._db.run('UPDATE server_configuration SET value = ? WHERE key = ?;', [c.value, c.key], function(err) {
            cb(err,this.changes);
        });
    },
    remove: function configStoreRemove(key,cb){
        var self = this;

        self._db.run('DELETE from server_configuration where key = ?', [key], function(err){
            cb(err,this.changes);
        });
    }
};