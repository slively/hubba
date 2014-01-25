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

        db.run("CREATE TABLE IF NOT EXISTS resources (id INTEGER PRIMARY KEY AUTOINCREMENT, resource TEXT)", function (err) {
            if(err) throw err;

            connecting = false;
            requestQeueue.forEach(function(f){
                f();
            });
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

    this.find = function find(id,cb){
        assert.number(id,'Resource id');

        if (connecting){
            var self = this;
            requestQeueue.push(function(){
                self.find(id,cb);
            });
        } else {
            db.all('select * from resources where id = ?',[id],function(err,result){
                var r;

                if (result.length === 0){
                    err =  new Error("No resource found with id " + id);
                } else if (result.length > 1){
                    err =  new Error("Multiple resources found with id " + id);
                } else {
                    r = JSON.parse(result[0].resource);
                    r.id = result[0].id;
                }

                cb(err,r);
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
            db.all('select * from resources;',function(err,result){
                var r = [];

                 for (var i = 0; i < result.length; i++){
                    r.push(JSON.parse(result[i].resource));
                    r[i].id = result[i].id;
                }

                cb(err,r);
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
            db.run('INSERT into resources (resource) VALUES (?);',[JSON.stringify(r)],function(err){
                if (err) throw err;
                cb(err,this.lastID);
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
            db.run('UPDATE resources set resource = ? where id = ?;',[JSON.stringify(r),r.id],function(err){
                if (err) throw err;
                cb(err,this.changes);
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
            db.run('delete from resources where id = ?;',[id],function(err){
                if (err) throw err;
                cb(err,this.changes);
            });
        }
        return this;
    };
/*
    this.nextID = function nextID(cb){
        if (connecting){
            var self = this;
            requestQeueue.push(function(){
                self.nextID(cb);
            });
        } else {
            db.all('SELECT * FROM SQLITE_SEQUENCE WHERE name="resources";',function(err,results){
                if (err) throw err;
                cb(err,results);
            });
        }
        return this;
    };
*/
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
            throw "ResourceStore type must be one of following: memory, file, redis.";
    }

    this.find = store.find;
    this.findAll = store.findAll;
    this.add = store.add;
    this.replace = store.replace;
    this.remove = store.remove;
    //this.nextID = store.nextID;
    this.destroyStore = store.destroyStore;
};

exports.ResourceStore = ResourceStore;