var assert = require('assert-plus'),
    sqlite3 = require('sqlite3'),
    ServiceStore = require('./service/serviceStore').ServiceStore,
    SocketStore = require('./socket/socketStore').SocketStore,
    FileStore = require('./file/fileStore').FileStore,
    UserStore = require('./user/userStore').UserStore,
    AuthStrategyStore = require('./user/authStrategyStore').AuthStrategyStore,
    fs = require('fs');

/*
    A simple class that manages the database connections,
    as well giving an api to each of the stores that hubba contains.
    Currently the only stores are for resources and sockets.
 */

var storesHash = {
    sockets: SocketStore,
    files: FileStore,
    services: ServiceStore,
    users: UserStore,
    authStrategies: AuthStrategyStore
};


exports.connect = function(opts,done){
    var o = opts || {},
        connectedCnt = 0,
        store = {};

    if (o.type === 'file' || o.type === 'memory'){
        if (o.type === 'file'){
            o.db = new sqlite3.Database(o.path + '/' + o.name + '.db',hubbaStoreConnected);
        } else {
            o.db = new sqlite3.Database(':memory:',hubbaStoreConnected);
        }

    }

    for ( var key in storesHash ) {
        store[key] = new modelsHash[key](o);
        store[key].connected(hubbaStoreConnected)
    }

    function hubbaStoreConnected(err){
        if (err){
            throw new Error('Hubba Store connection error:\n'+err.stack);
        }
        connectedCnt++;
        if (connectedCnt === Object.keys(modelsHash).length) {
            done(store);
        }
    }
};