"use strict";

function transformService(result){
    var s;
    try {
        s = JSON.parse(result.service);
        s.id = result.id;
        s.version = result.version;
        s.path = result.path;
        s.seq = result.seq;
        s.requiresAuthentication = (result.requires_authentication === 1);
        return s;
    } catch (error){
        throw new Error("Error parsing service from the database! ("+result[0].service+")");
    }
}

exports.Adapter = {
    connected: function serviceSQLiteConnected(d){
        var self = this,
            done = d || function(){};

        self._db.serialize(function(){
            self._db.run("CREATE TABLE IF NOT EXISTS services (id INTEGER PRIMARY KEY AUTOINCREMENT, version INTEGER DEFAULT 1 NOT NULL, path TEXT NOT NULL UNIQUE, seq NOT NULL UNIQUE, requires_authentication BOOLEAN NOT NULL DEFAULT 0, service TEXT NOT NULL);", function (err) {
                if(err) done(err);

                self._db.run("CREATE TABLE IF NOT EXISTS service_versions (service_id INTEGER, version INTEGER NOT NULL, path TEXT NOT NULL, seq INTEGER NOT NULL, requires_authentication BOOLEAN NOT NULL DEFAULT 0, service TEXT NOT NULL, FOREIGN KEY(service_id) REFERENCES services(id), PRIMARY KEY (service_id, version));", function(err){
                    if(err) done(err);

                    done();
                })
            });
        });
    },
    find: function serviceSQLiteFind(id,cb){
        var self = this;

        self._db.all('SELECT * from services where id = ?;',[id],function(err,result){

            if (err){
                cb(err);
            } else if (result.length === 0){
                cb(new Error("No service found with id " + id));
            } else {
                try {
                    cb(undefined,transformService(result[0]));
                } catch (error){
                    cb(error);
                }
            }
        });
    },
    findVersion: function serviceSQLiteFindVersion(obj,cb){
        var self = this;

        self._db.all('SELECT * from service_versions where service_id = ? and version = ?;',[obj.id,obj.version],function(err,result){
            if (err){
                cb(err);
            } else if (result.length === 0) {
                self._db.run('SELECT * from services where id = ? and version = ?',[obj.id,obj.version],function(err,result){
                    if (err){
                        cb(err);
                    } else if (result.length === 0){
                        cb(new Error("No service found with id " + obj.id + " and version " + obj.version));
                    } else {
                        try {
                            cb(undefined,transformService(result[0]));
                        } catch (error){
                            cb(error);
                        }
                    }
                })
            } else {
                try {
                    cb(undefined,transformService(result[0]));
                } catch (error){
                    cb(error);
                }
            }
        });
    },
    findAll: function serviceSQLiteFindAll(cb){
        var self = this;

        self._db.all('SELECT * from services ORDER BY seq;',function(err,result){
            var r = [], e = "";

            if (err){
                cb(err);
            } else {
                for (var i = 0; i < result.length; i++){
                    try {
                        r.push(transformService(result[i]));
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
    },
    add: function serviceSQLiteAdd(service,cb){
        var self = this,
            s = service.toJSON(),
            path = service.path,
            seq = service.seq,
            auth = service.requiresAuth || 0,
            serviceAtSeq;


            self._db.all('SELECT id from services where seq = ?',[seq],function(err,result){
                if(err) {
                    cb(err);
                    return;
                }
                serviceAtSeq = result[0] || {};

                self._db.serialize(function(){
                    if (serviceAtSeq.id) {
                        self._db.run('UPDATE services SET seq = seq + 1 where id in (SELECT id from services where seq >= ? ORDER BY seq DESC);', [seq], function(err2){
                            if (err2){
                                cb(err2);
                                return;
                            }

                            self._db.run('INSERT into services (version,seq,path,requires_authentication,service) VALUES(1,?,?,?,?);',[seq,path,auth,JSON.stringify(s)],function(err3){
                                cb(err3,this.lastID);
                            });
                        });
                    } else {
                        self._db.run('INSERT into services (version,seq,path,requires_authentication,service) VALUES(1,?,?,?,?);',[seq,path,auth,JSON.stringify(s)],function(err3){
                            cb(err3,this.lastID);
                        });
                    }
                });
            });
    },
    replace: function serviceSQLiteReplace(service,cb){
        var self = this,
            params = {
                $id: service.id,
                $seq: service.seq,
                $path: service.path,
                $auth: service.requiresAuthentication,
                $service: JSON.stringify(service.toJSON())
            },
            updateSeqs = false;

        function update(err) {
            if (err) {
                cb(err);
                return;
            }

            self._db.run('UPDATE services set version = version + 1, service = $service, path = $path, seq = $seq, requires_authentication = $auth where id = $id;', params, function(err){
                cb(err,this.changes);
                /*if (err) {
                    cb(err);
                    return;
                }

                self._db.run('INSERT into service_versions (service_id, version, path, service, seq) select id, version + 1, path, service, seq from services where id = ?;', [params.$id], function(err){
                    cb(err,this.changes);
                });*/
            });
        }

        self._db.all('SELECT id from services where seq = ?',[params.$seq],function(err,result) {
            if (err) {
                cb(err);
                return;
            }

            if (result.length && result[0].id != params.$id) {
                updateSeqs = true;
                self._db.run(
                    'UPDATE services SET seq = seq + 1 where id in (SELECT id from services where seq >= ? ORDER BY seq DESC);',
                    [params.$seq],
                    update
                );
            } else {
                update();
            }
        });
    },
    remove: function serviceSQLiteRemove(id,cb){
        var self = this;

        //self._db.serialize(function(){
        //    self._db.run('DELETE from service_versions where service_id = ?', [id], function(err){
         //       if (err)
          //          cb(err);

                self._db.run('DELETE from services where id = ?;', [id], function(err){
                    cb(err,this.changes);
                });
            //});
        //});
    }
};