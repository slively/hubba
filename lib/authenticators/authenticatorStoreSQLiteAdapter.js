"use strict";

/*
    authenticator model:
    {
        id: 1, // from database
        name: '...', // unique name of authenticator, also passed to passportjs
        strategy: '...', // tells us which auth strategy (authenticatorFactory) to use to instantiate
        configuration: {...}, // configuration object passed directly into passportjs
        code: '...' // custom code used to in the authenticator instantiation when passed to passportjs
    }
 */

function transformAuthenticator(dbObj) {
    dbObj.configuration = dbObj.configuration || {};
    dbObj.configuration = JSON.parse(dbObj.configuration);
    return dbObj;
}

exports.Adapter = {
    connected: function authenticatorConnected(d){
        var self = this,
            done = d || function(){};

        self._db.serialize(function(){
            self._db.run("CREATE TABLE IF NOT EXISTS authenticators (id INTEGER PRIMARY KEY AUTOINCREMENT, version INTEGER DEFAULT 1 NOT NULL, name TEXT NOT NULL UNIQUE, strategy TEXT NOT NULL, successRedirect TEXT, failureRedirect TEXT,  configuration TEXT, code TEXT);", function (err) {
                if(err) done(err);

                self._db.run("CREATE TABLE IF NOT EXISTS authenticator_versions (authenticator_id INTEGER, version INTEGER NOT NULL, name TEXT NOT NULL, strategy TEXT NOT NULL, successRedirect TEXT, failureRedirect TEXT, configuration TEXT, code TEXT, FOREIGN KEY(authenticator_id) REFERENCES authenticators(id), PRIMARY KEY (authenticator_id, version));", function(err){
                    if(err) done(err);
                    done();
                });
            });
        });

        return this;
    },
    find: function authenticatorFind(id,cb){
        var self = this;

        self._db.all('SELECT * from authenticators where id = ?;',[id],function(err,result){
            if (err){
                cb(err);
            } else if (result.length === 0){
                cb(new Error("No auth authenticator found with id " + id));
            } else {
                try {
                    cb(undefined, transformAuthenticator(result[0]));
                } catch(e) {
                    cb(e);
                }
            }
        });

        return this;
    },
    findVersion: function authenticatorFindVersion(obj,cb){
        var self = this;

        self._db.all('SELECT * from authenticator_versions where authenticator_id = ? and version = ?;',[obj.id,obj.version],function(err,result){
            if (err){
                cb(err);
            } else if (result.length === 0) {
                self._db.run('SELECT * from authenticators where id = ? and version = ?',[obj.id,obj.version],function(err,result){
                    if (err){
                        cb(err);
                    } else if (result.length === 0){
                        cb(new Error("No authenticator found with id " + obj.id + " and version " + obj.version));
                    } else {
                        try {
                            cb(undefined,transformAuthenticator(result[0]));
                        } catch (error){
                            cb(error);
                        }
                    }
                })
            } else {
                try {
                    cb(undefined,transformAuthenticator(result[0]));
                } catch (error){
                    cb(error);
                }
            }
        });

        return this;
    },
    findAll: function authenticatorFindAll(cb){
        var self = this;

        self._db.all('SELECT * from authenticators;',function(err,result){
            var r = [], e = "";

            if (err){
                cb(err);
            } else {
                for (var i = 0; i < result.length; i++){
                    try {
                        r.push(transformAuthenticator(result[i]));
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
    add: function authenticatorAdd(authenticator,cb){
        var self = this;

        self._db.run(
            'INSERT into authenticators (name,strategy,configuration,code,successRedirect,failureRedirect) VALUES(?,?,?,?,?,?);',
            [authenticator.name, authenticator.strategy, authenticator.configuration, authenticator.code, authenticator.successRedirect, authenticator.failureRedirect],
            function(err) {
                cb(err,this.lastID);
            }
        );

        return this;
    },
    replace: function authenticatorReplace(authenticator,cb){
        var self = this;

        self._db.run(
            'INSERT into authenticator_versions (authenticator_id, name, version, strategy, configuration, code, successRedirect, failureRedirect) select id, name, version, strategy, configuration, code, successRedirect, failureRedirect from authenticators where id = ?;',
            [authenticator.id],
            function(err){
                if (err) {
                    cb(err);
                    return;
                }

                self._db.run(
                    'UPDATE authenticators set version = version + 1, name = ?, strategy = ?, configuration = ?, code = ?, successRedirect = ?, failureRedirect = ? where id = ?;',
                    [authenticator.name, authenticator.strategy, authenticator.configuration, authenticator.code, authenticator.successRedirect, authenticator.failureRedirect, authenticator.id],
                    function(err){
                        cb(err, this.changes);
                    }
                );
            }
        );

        return this;
    },
    remove: function authenticatorRemove(id,cb){
        var self = this;


        self._db.run('DELETE from authenticators where id = ?;', [id], function(err){
            cb(err,this.changes);
        });

        return this;
    }
};