var assert = require('assert-plus'),
    sqlite3 = require('sqlite3'),
    _ = require('lodash'),
    fs = require('fs');

/*
    A simple class that manages the database connections,
    as well giving an api to each of the stores that hubba contains.
*/

var db;


exports.connect = function(opts,done){
    var o = opts || {},
        connectedCnt = 0,
        stores = {};

    if (o.type === 'file' || o.type === 'memory'){
        if (o.type === 'file'){
            o.db = new sqlite3.Database(o.path + '/' + o.name + '.db',hubbaStoreConnected);
        } else {
            o.db = new sqlite3.Database(':memory:',hubbaStoreConnected);
        }
    }

    db = o.db;

    fs.readdirSync(__dirname+'/sqliteAdapters').forEach(function(adapterFileName){
        var Adapter = require('./sqliteAdapters/'+adapterFileName.replace('.js','')).Adapter,
            store =  new GenericStore({
                db: db,
                Adapter: Adapter
            });

        stores[store.name] = store;
        stores[store.name].connected(hubbaStoreConnected);
    });

    function hubbaStoreConnected(err){
        if (err){
            throw new Error('Hubba Store connection error:\n'+err.stack);
        }
        connectedCnt++;
        if (connectedCnt === Object.keys(stores).length) {
            done(stores);
        }
    }
};

exports.disconnect = function() {
    if (db) {
        try {
            db.close(function(err) {
                if (err) {
                    console.warn('Error attempting to close the Hubba database connection.');
                    console.warn(e.stack);
                }
            });
        } catch(e) {
            console.warn('Error calling close on the Hubba database.');
            console.warn(e.stack);
        }
    }
};


/*
 Generic store interface used for resources, sockets, or anything else.
 Should validate that for each type of client the correct functionality is available.
 Each adapter type must be defined when inherited so they are available during instantiation.
 */
function GenericStore(opts){
    var self = this,
        o = opts || {};

    assert.object(o.db,'db object is required');
    assert.object(o.Adapter,'Adapter object is required');

    this._db = o.db;
    _.each(o.Adapter, function(method, name){
        self[name] = method;
    });
}