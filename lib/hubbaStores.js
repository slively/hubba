var assert = require('assert-plus'),
    sqlite3 = require('sqlite3'),
    SocketStore = require('./socket/socketStore').SocketStore;


function hubbaStoresConnectionError(err){
    if (err){
        console.log('Hubba Store connectin error:\n',err.stack);
    }
}


function HubbaStores(opts){
    var o = opts || {},
        name = o.name || 'hubba';

    if (o.type === 'file' || o.type === 'memory'){
        if (o.type === 'file'){
            try{
                fs.mkdirSync(__dirname+'/sqliteDB');
            } catch(e){}
            o.db = new sqlite3.Database(__dirname+'/sqliteDB/'+name+'.db',hubbaStoresConnectionError);
        } else {
            o.db = new sqlite3.Database(':memory:',hubbaStoresConnectionError);
        }

        this.sockets = new SocketStore(o);
        this.sockets.connected(hubbaStoresConnectionError);
//    this.resources = new resourceStore();
//    this.resources.connected(hubbaStoreConnectionError)
    } else {
      // TODO: do something else!
    }
}

exports.HubbaStores = HubbaStores;