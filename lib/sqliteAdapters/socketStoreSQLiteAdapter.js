function transformSocket(result){
    var s;
    try {
        s = JSON.parse(result.socket);
        s.id = result.id;
        s.name = result.name;
        s.version = result.version;
        s.requiresAuthentication = (result.requires_authentication === 1);
        return s;
    } catch (error){
        throw new Error("Error parsing socket from the database! ("+result[0].socket+")");
    }
}

exports.Adapter = {
    name: 'sockets',
    connected: function socketFileStoreConnected(d){
        var self = this,
            done = d || function(){};

        self._db.serialize(function() {
            self._db.run("CREATE TABLE IF NOT EXISTS sockets (id INTEGER PRIMARY KEY, name TEXT NOT NULL UNIQUE, version INTEGER DEFAULT 1 NOT NULL, requires_authentication BOOLEAN NOT NULL DEFAULT 0, socket TEXT NOT NULL);", function (err) {
                if(err) done(err);

                self._db.run("CREATE TABLE IF NOT EXISTS socket_versions (socket_id INTEGER NOT NULL, name TEXT NOT NULL, version INTEGER NOT NULL, requires_authentication BOOLEAN NOT NULL, socket TEXT, FOREIGN KEY(socket_id) REFERENCES sockets(id), PRIMARY KEY (socket_id, version));", function(err){
                    if(err) done(err);

                    done();
                })
            });
        });
    },
    find: function socketFileStoreFind(id,cb){
        var self = this;

        self._db.all('SELECT * from sockets where id = ?;',[id],function(err,result){

            if (err){
                cb(err);
            } else if (result.length === 0){
                cb(new Error("No socket found with id " + id));
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

        self._db.all('SELECT * from socket_versions where socket_id = ? and version = ?;',[obj.id,obj.version],function(err,result){
            if (err){
                cb(err);
            } else if (result.length === 0) {
                self._db.run('SELECT * from sockets where id = ? and version = ?',[obj.id,obj.version],function(err,result){
                    if (err){
                        cb(err);
                    } else if (result.length === 0){
                        cb(new Error("No socket found with id " + obj.id + " and version " + obj.version));
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
                    result[0].id = obj.id;
                    delete result[0].socket_id;
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

        self._db.run('INSERT into sockets (name,version,requires_authentication,socket) VALUES(?,1,?,?);', [socket.name, s.requiresAuthentication, JSON.stringify(s)], function(err) {
            cb(err,this.lastID);
        });
    },
    replace: function socketFileStoreReplace(socket,cb){
        var self = this,
            s = socket.toJSON();

        self._db.serialize(function(){
            self._db.run('INSERT into socket_versions (socket_id, name, version, requires_authentication, socket) select id, name, version, requires_authentication, socket from sockets where id = ?;', [socket.id], function(err){
                if (err)
                    cb(err);

                self._db.run('UPDATE sockets set version = version + 1, name = ?, requires_authentication = ?, socket = ? where id = ?;', [s.name, s.requiresAuthentication, JSON.stringify(s), s.id], function(err){
                    cb(err,this.changes);
                });
            });
        });
    },
    remove: function socketFileStoreRemove(id,cb){
        var self = this;

        self._db.serialize(function(){
            self._db.run('DELETE from socket_versions where socket_id = ?', [id], function(err){
                if (err)
                    cb(err);

                self._db.run('DELETE from sockets where id = ?;',[id],function(err){
                    cb(err,this.changes);
                });
            });
        });
    }
};