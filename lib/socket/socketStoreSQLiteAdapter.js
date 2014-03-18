function transformSocket(result){
    var s;
    try {
        s = JSON.parse(result.socket);
        s.name = result.name;
        s.version = result.version;
        return s;
    } catch (error){
        throw new Error("Error parsing socket from the database! ("+result[0].socket+")");
    }
}

exports.Adapter = {
    connected: function socketFileStoreConnected(d){
        var self = this,
            done = d || function(){};

        self._db.serialize(function(){
            self._db.run("CREATE TABLE IF NOT EXISTS sockets (name TEXT PRIMARY KEY, version INTEGER DEFAULT 1 NOT NULL, socket TEXT NOT NULL);", function (err) {
                if(err) done(err);

                self._db.run("CREATE TABLE IF NOT EXISTS socket_versions (socket_name TEXT, version INTEGER NOT NULL, socket TEXT, FOREIGN KEY(socket_name) REFERENCES sockets(name), PRIMARY KEY (socket_name, version));", function(err){
                    if(err) done(err);

                    done();
                })
            });
        });
    },
    find: function socketFileStoreFind(name,cb){
        var self = this;

        self._db.all('SELECT * from sockets where name = ?;',[name],function(err,result){

            if (err){
                cb(err);
            } else if (result.length === 0){
                cb(new Error("No socket found with name " + name));
            } else {
                try {
                    cb(undefined,transformSocket(result[0]));
                } catch (error){
                    cb(error);
                }
            }
        });
    },
    findVersion: function socketFileStoreFindVersion(obj,cb){
        var self = this;

        self._db.all('SELECT * from socket_versions where socket_name = ? and version = ?;',[obj.name,obj.version],function(err,result){
            if (err){
                cb(err);
            } else if (result.length === 0) {
                self._db.run('SELECT * from sockets where name = ? and version = ?',[obj.name,obj.version],function(err,result){
                    if (err){
                        cb(err);
                    } else if (result.length === 0){
                        cb(new Error("No socket found with name " + obj.name + " and version " + obj.version));
                    } else {
                        try {
                            cb(undefined,transformSocket(result[0]));
                        } catch (error){
                            cb(error);
                        }
                    }
                })
            } else {
                try {
                    result[0].name = obj.name;
                    delete result[0].socket_name;
                    cb(undefined,transformSocket(result[0]));
                } catch (error){
                    cb(error);
                }
            }
        });
    },
    findAll: function socketFileStoreFindAll(cb){
        var self = this;

        self._db.all('SELECT * from sockets;',function(err,result){
            var r = [], e = "";

            if (err){
                cb(err);
            } else {
                for (var i = 0; i < result.length; i++){
                    try {
                        r.push(transformSocket(result[i]));
                    } catch (error){
                        e += error.message + ' \n';
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
    add: function socketFileStoreAdd(socket,cb){
        var self = this,
            s = {
                code: socket.code,
                methods: socket.methods
            };

        self._db.run('INSERT into sockets (name,version,socket) VALUES(?,1,?);', [socket.name,JSON.stringify(s)], function(err) {
            cb(err,this.lastID);
        });
    },
    replace: function socketFileStoreReplace(socket,cb){
        var self = this,
            s = {
                code: socket.code,
                methods: socket.methods
            };

        self._db.serialize(function(){
            self._db.run('INSERT into socket_versions (socket_name, version, socket) select name, version, socket from sockets where name = ?;', [socket.name], function(err){
                if (err)
                    cb(err);

                self._db.run('UPDATE sockets set version = version + 1, socket = ? where name = ?;', [JSON.stringify(s), socket.name], function(err){
                    cb(err,this.changes);
                });
            });
        });
    },
    remove: function socketFileStoreRemove(name,cb){
        var self = this;

        self._db.serialize(function(){
            self._db.run('DELETE from socket_versions where socket_name = ?', [name], function(err){
                if (err)
                    cb(err);

                self._db.run('DELETE from sockets where name = ?;',[name],function(err){
                    cb(err,this.changes);
                });
            });
        });
    }
};