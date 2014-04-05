exports.Adapter = {
    connected: function fileSQLiteStoreConnected(d){
        var self = this,
            done = d || function(){};

        self._db.serialize(function(){
            self._db.run("CREATE TABLE IF NOT EXISTS files (id INTEGER PRIMARY KEY AUTOINCREMENT, version INTEGER DEFAULT 1 NOT NULL, path TEXT NOT NULL UNIQUE, contents TEXT);", function (err) {
                if(err) done(err);

                self._db.run("CREATE TABLE IF NOT EXISTS file_versions (file_id INTEGER, version INTEGER NOT NULL, path TEXT NOT NULL, contents TEXT, FOREIGN KEY(file_id) REFERENCES files(id), PRIMARY KEY (file_id, version));", function(err) {
                    if(err) done(err);

                    done();
                })
            });
        });
    },
    find: function fileSQLiteStoreFind(id,cb){
        var self = this;

        self._db.all('SELECT * from files where id = ?;',[id],function(err,result){

            if (err){
                cb(err);
            } else if (result.length === 0){
                cb(new Error("No file with id " + id));
            } else {
                cb(undefined,result[0]);
            }
        });
    },
    findVersion: function fileSQLiteStoreFindVersion(obj,cb){
        var self = this;

        self._db.all('SELECT * from file_versions where id = ? and version = ?;',[obj.id,obj.version],function(err,result){
            if (err){
                cb(err);
            } else if (result.length === 0) {
                self._db.run('SELECT * from files where id = ? and version = ?',[obj.name,obj.version],function(err,result){
                    if (err){
                        cb(err);
                    } else if (result.length === 0){
                        cb(new Error("No file found with id " + obj.id + " and version " + obj.version));
                    } else {
                        cb(undefined,result[0]);
                    }
                })
            } else {
                cb(undefined,result[0]);
            }
        });
    },
    findAll: function fileSQLiteStoreFindAll(opts,callback){
        var self = this,
            cb = callback || opts,
            query = 'SELECT id, version, path';

        if (callback && opts.includeContents){
            query += ', contents';
        }

        query += ' from files ORDER BY length(path);';

        self._db.all(query,function(err,result){
            var r = [], e = "";

            if (err){
                cb(err);
                return;
            } else {
                for (var i = 0; i < result.length; i++){
                    try {
                        r.push(result[i]);
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
    add: function fileSQLiteStoreAdd(file,cb){
        var self = this;

        self._db.run('INSERT into files (version,path,contents) VALUES(1,?,?);', [file.path,file.contents], function(err) {
            cb(err,this.lastID);
        });
    },
    replace: function fileSQLiteStoreReplace(file,cb){
        var self = this;

        self._db.serialize(function(){

            // check for duplicate paths first
            self._db.run('SELECT count(*) from files where path = ?',[file.path],function(result){

                if (result) {
                    cb(new Error('File path must be unique, a file already exists with path: ' + file.path));
                    return;
                }

                self.find(file.id,function(err,ogFile) {

                    if (err) {
                        cb(err);
                        return;
                    }

                    self._db.run('INSERT into file_versions (file_id, version, path, contents) select id, version, path, contents from files where id = ?;', [file.id], function(err){
                        if (err) {
                            cb(err);
                            return;
                        }

                        var updateStr = 'UPDATE files set version = version + 1 ',
                            args = [];

                        if (file.path) {
                            updateStr += ', path = ?';
                            args.push(file.path);
                        }
                        if (file.contents) {
                            updateStr += ', contents = ?';
                            args.push(file.contents);
                        }
                        updateStr += ' where id = ?;';
                        args.push(file.id);

                        self._db.run(updateStr, args, function(err){

                            file.contents = file.contents || ogFile.contents;

                            cb(err,{
                                old: ogFile,
                                'new': file
                            });
                        });
                    });

                });

            });
        });
    },
    remove: function fileSQLiteStoreRemove(id,cb){
        var self = this;

        self._db.serialize(function(){
            self._db.run('DELETE from file_versions where file_id = ?', [id], function(err){
                if (err) {
                    cb(err);
                    return;
                }

                self._db.run('DELETE from files where id = ?;',[id],function(err){
                    cb(err,this.changes);
                });
            });
        });
    },
    renameFolder: function fileSQLiteStoreRenameFolder(obj,cb) {
        var self = this;

        self._db.run('UPDATE files SET path = replace(path,?,?) WHERE path LIKE ?;', [obj.oldPath,obj.newPath,obj.oldPath+'%'], function(err){
            cb(err,this.changes);
        });
    },
    removeFolder: function fileSQLiteStoreRemoveFolder(path,cb) {
        var self = this;

        self._db.run('DELETE from files where path LIKE ?;', [path+'%'], function(err){
            cb(err,this.changes);
        });
    }
};