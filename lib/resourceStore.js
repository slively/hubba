var assert = require('assert-plus'),
    sqlite3 = require('sqlite3'),
    redis = require('redis'),
    fs = require('fs');


function SQLiteStore(opts){
    var o = opts || {},
        name = o.name || 'hubba',
        connecting = true,
        requestQeueue = [],
        db;

    function connected(err){
        if(err) {
            throw err;
        }

        db.run("CREATE TABLE IF NOT EXISTS resources (id INTEGER PRIMARY KEY AUTOINCREMENT, version INTEGER DEFAULT 1 NOT NULL, resource TEXT NOT NULL);", function (err) {
            if(err) throw err;

            db.run("CREATE TABLE IF NOT EXISTS resource_versions (resource_id INTEGER, version INTEGER NOT NULL, resource TEXT, FOREIGN KEY(resource_id) REFERENCES resources(id), PRIMARY KEY (resource_id, version));", function(err){
                if(err) throw err;

                connecting = false;
                requestQeueue.forEach(function(f){
                    f();
                });
            })
        });
    };

    if (o.type === 'file'){
        try{
            fs.mkdirSync(__dirname+'/sqliteDB');
        } catch(e){}
        db = new sqlite3.Database(__dirname+'/sqliteDB/'+name+'.db',connected);
    } else {
        db = new sqlite3.Database(':memory:',connected);
    }

    function transformResource(result){
        var r
        try {
            r = JSON.parse(result.resource);
            r.id = result.id;
            r.version = result.version;
            return r;
        } catch (error){
            throw new Error("Error parsing resource from the database! ("+result[0].resource+")");
        }
    }

    this.find = function find(id,cb){
        assert.number(id,'Resource id');

        if (connecting){
            var self = this;
            requestQeueue.push(function(){
                self.find(id,cb);
            });
        } else {
            db.all('SELECT * from resources where id = ?;',[id],function(err,result){
                var r, e = err;

                if (err){
                    cb(err);
                } else if (result.length === 0){
                    cb(new Error("No resource found with id " + id));
                } else {
                    try {
                        cb(undefined,transformResource(result[0]));
                    } catch (error){
                        cb(error);
                    }
                }
            });
        }
        return this;
    };

    this.findVersion = function find(obj,cb){
        assert.object(obj,'Resource id and version');
        assert.number(obj.id,'Resource id');
        assert.number(obj.version,'Resource version');

        if (connecting){
            var self = this;
            requestQeueue.push(function(){
                self.findVersion(obj,cb);
            });
        } else {
            db.all('SELECT * from resource_versions where resource_id = ? and version = ?;',[obj.id,obj.version],function(err,result){
                if (err){
                    cb(err);
                } else if (result.length === 0) {
                    db.run('SELECT * from resources where resource_id = ? and version = ?',[obj.id,obj.version],function(err,result){
                        if (err){
                            cb(err);
                        } else if (result.length === 0){
                            cb(new Error("No resource found with id " + obj.id + " and version " + obj.version));
                        } else {
                            try {
                                cb(undefined,transformResource(result[0]));
                            } catch (error){
                                cb(error);
                            }
                        }
                    })
                } else {
                    try {
                        result[0].id = obj.id;
                        delete result[0].resource_id;
                        cb(undefined,transformResource(result[0]));
                    } catch (error){
                        cb(error);
                    }
                }
            });
        }
        return this;
    };

    this.findAll = function findAll(cb){

        if (connecting){
            var self = this;
            requestQeueue.push(function(){
                self.findAll(cb);
            });
        } else {
            db.all('SELECT * from resources;',function(err,result){
                var r = [], e = "";

                if (err){
                    cb(err);
                } else {
                    for (var i = 0; i < result.length; i++){
                        try {
                            r.push(transformResource(result[i]));
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
        }
        return this;
    };

    this.add = function add(resource,cb){
        assert.object(resource,'Resource body');

        if (connecting){
            var self = this;
            requestQeueue.push(function(){
                self.add(resource,cb);
            });
        } else {
            var r = {
                id: resource.id,
                name: resource.name,
                type: resource.type,
                parentId: resource.parentId,
                path: resource.path,
                configuration: resource.configuration
            };

            if (resource.isRoot){
                r.isRoot = true;
            }

            db.serialize(function(){
                db.run('INSERT into resources (version,resource) VALUES(1,?);', [JSON.stringify(r)], function(err) {
                    cb(err,this.lastID);
                });
            });
        }
        return this;
    };

    this.replace = function replace(resource,cb){
        assert.object(resource,'Resource body');
        assert.number(resource.id,'Resource id');

        if (connecting){
            var self = this;
            requestQeueue.push(function(){
                self.replace(resource,cb);
            });
        } else {
            var r = {
                id: resource.id,
                name: resource.name,
                type: resource.type,
                parentId: resource.parentId,
                path: resource.path,
                configuration: resource.configuration
            };

            db.serialize(function(){
                db.run('INSERT into resource_versions (resource_id, version, resource) select id, version, resource from resources where id = ?;', [r.id], function(err){
                    if (err)
                        cb(err);

                    db.run('UPDATE resources set version = version + 1, resource = ? where id = ?;', [JSON.stringify(r), r.id], function(err){
                        cb(err,this.changes);
                    });
                });
            });
        }
        return this;
    };

    this.remove = function remove(id,cb){
        assert.number(id,'Resource id');

        if (connecting){
            var self = this;
            requestQeueue.push(function(){
                self.remove(id,cb);
            });
        } else {
            db.serialize(function(){
                db.run('DELETE from resource_versions where resource_id = ?', [id], function(err){
                    if (err)
                        cb(err);

                    db.run('DELETE from resources where id = ?;',[id],function(err){
                        cb(err,this.changes);
                    });
                });
            });
        }
        return this;
    };

    this.destroyStore = function destroyStore(){
        if (o.type === 'file'){
            connecting = true;
            fs.unlinkSync(__dirname+'/sqliteDB/'+name+'.db');
        } else {
            db = new sqlite3.Database(':memory:',connected);
        }
        return this;
    };

}

function ResourceStore(opts){
    var o = opts || {};

    assert.string(o.type);
    var store;

    switch(o.type)
    {
        case 'memory':
        case 'file':
            store = new SQLiteStore(o);
            break;
        case 'redis':
            store = new RedisStore(o);
            break;
        default:
            throw 'ResourceStore type must be one of following: memory, file, redis.';
    }

    this.find = store.find;
    this.findVersion = store.findVersion;
    this.findAll = store.findAll;
    this.add = store.add;
    this.replace = store.replace;
    this.remove = store.remove;
    //this.nextID = store.nextID;
    this.destroyStore = store.destroyStore;
};

exports.ResourceStore = ResourceStore;