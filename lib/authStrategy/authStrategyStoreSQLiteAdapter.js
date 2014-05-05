"use strict";

/*
    authStrategy model:
    {
        id: 1, // from database
        name: '...', // unique name of strategy, also passed to passportjs
        type: '...', // tells us which auth plugin (authStrategyFactory) to use to instantiate
        configuration: {...}, // configuration object passed directly into passportjs
        code: '...' // custom code used to in the strategy instantiation when passed to passportjs
    }
 */

function transformStrategy(dbObj) {
    dbObj.configuration = dbObj.configuration || {};
    dbObj.configuration = JSON.parse(dbObj.configuration);
    return dbObj;
}

exports.Adapter = {
    connected: function authStrategyConnected(d){
        var self = this,
            done = d || function(){};

        self._db.serialize(function(){
            self._db.run("CREATE TABLE IF NOT EXISTS auth_strategies (id INTEGER PRIMARY KEY AUTOINCREMENT, version INTEGER DEFAULT 1 NOT NULL, name TEXT NOT NULL UNIQUE, type TEXT NOT NULL, configuration TEXT, code TEXT);", function (err) {
                if(err) done(err);

                self._db.run("CREATE TABLE IF NOT EXISTS auth_strategy_versions (auth_strategy_id INTEGER, version INTEGER NOT NULL, name TEXT NOT NULL, type TEXT NOT NULL, configuration TEXT, code TEXT, FOREIGN KEY(auth_strategy_id) REFERENCES auth_strategies(id), PRIMARY KEY (auth_strategy_id, version));", function(err){
                    if(err) done(err);

                    done();
                })
            });
        });

        return this;
    },
    find: function authStrategyFind(id,cb){
        var self = this;

        self._db.all('SELECT * from auth_strategies where id = ?;',[id],function(err,result){
            if (err){
                cb(err);
            } else if (result.length === 0){
                cb(new Error("No auth strategy found with id " + id));
            } else {
                try {
                    cb(undefined, transformStrategy(result[0]));
                } catch(e) {
                    cb(e);
                }
            }
        });

        return this;
    },
    findVersion: function authStrategyFindVersion(obj,cb){
        var self = this;

        self._db.all('SELECT * from auth_strategy_versions where auth_strategy_id = ? and version = ?;',[obj.id,obj.version],function(err,result){
            if (err){
                cb(err);
            } else if (result.length === 0) {
                self._db.run('SELECT * from auth_strategies where id = ? and version = ?',[obj.id,obj.version],function(err,result){
                    if (err){
                        cb(err);
                    } else if (result.length === 0){
                        cb(new Error("No auth_strategy found with id " + obj.id + " and version " + obj.version));
                    } else {
                        try {
                            cb(undefined,transformStrategy(result[0]));
                        } catch (error){
                            cb(error);
                        }
                    }
                })
            } else {
                try {
                    cb(undefined,transformStrategy(result[0]));
                } catch (error){
                    cb(error);
                }
            }
        });

        return this;
    },
    findAll: function authStrategyFindAll(cb){
        var self = this;

        self._db.all('SELECT * from auth_strategies;',function(err,result){
            var r = [], e = "";

            if (err){
                cb(err);
            } else {
                for (var i = 0; i < result.length; i++){
                    try {
                        r.push(transformStrategy(result[i]));
                    } catch (error){
                        e += error.stack + ' \n';
                    }
                }
            }

            if (e.length){
                cb(new Error(e));
            } else {
                cb(undefined,r);
            }
        });

        return this;
    },
    add: function authStrategyAdd(strategy,cb){
        var self = this;

        self._db.run(
            'INSERT into auth_strategies (name,type,configuration,code) VALUES(?,?,?,?);',
            [strategy.name, strategy.type, strategy.configuration, strategy.code],
            function(err) {
                cb(err,this.lastID);
            }
        );

        return this;
    },
    replace: function authStrategyReplace(strategy,cb){
        var self = this;

        self._db.run(
            'INSERT into auth_strategy_versions (auth_strategy_id, name, version, type, configuration, code) select id, name, version, type, configuration, code from auth_strategies where id = ?;',
            [strategy.id],
            function(err){
                if (err)
                    cb(err);

                self._db.run(
                    'UPDATE auth_strategies set version = version + 1, name = ?, type = ?, configuration = ?, code = ? where id = ?;',
                    [strategy.name, strategy.type, strategy.configuration, strategy.code, strategy.id],
                    function(err){
                        if (this.changes === 0) {
                            cb(new Error('No auth strategy found with id ' + strategy.id));
                        } else {
                            cb(err, this.changes);
                        }
                    }
                );
            }
        );

        return this;
    },
    remove: function authStrategyRemove(id,cb){
        var self = this;


        self._db.run('DELETE from auth_strategies where id = ?;', [id], function(err){
            cb(err,this.changes);
        });

        return this;
    }
};