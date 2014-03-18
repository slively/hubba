var assert = require('assert-plus'),
    sqlite3 = require('sqlite3'),
    SocketStore = require('./socket/socketStore').SocketStore,
    FileStore = require('./file/fileStore').FileStore;

/*
    A simple class that manages the database connections,
    as well giving an api to each of the stores that hubba contains.
    Currently the only stores are for resources and sockets.
 */
function HubbaStore(opts){
    var o = opts || {},
        name = o.name || 'hubba';

    if (o.type === 'file' || o.type === 'memory'){
        if (o.type === 'file'){
            try {
                fs.mkdirSync(__dirname+'/sqliteDB');
            } catch(e){}
            o.db = new sqlite3.Database(__dirname+'/sqliteDB/'+name+'.db',hubbaStoreConnectionError);
        } else {
            o.db = new sqlite3.Database(':memory:',hubbaStoreConnectionError);
        }

    } else {
        // TODO redis client
        o.db = {};
    }

    this.sockets = new SocketStore(o);
    this.sockets.connected(hubbaStoreConnectionError);
    this.files = new FileStore(o);
    this.files.connected(hubbaStoreConnectionError);
//    this.resources = new resourceStore();
//    this.resources.connected(hubbaStoreConnectionError)
}

function hubbaStoreConnectionError(err){
    if (err){
        throw new Error('Hubba Store connection error:\n',err.stack);
    }
}

exports.HubbaStore = HubbaStore;