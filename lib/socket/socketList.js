var assert = require('assert-plus');

// Responsibilities:
//  Maintain a cached list of socket resources from the store (file/memory/redis)
//  Validate added/updated socket models
//  Emit all socket update events with a timestamp so the router and other processes/servers can be notified

// Input
//  store: instantiated SocketStore

function SocketList(o, m){
    var opts = o || {},
        mocks = m || {},
        socketsCache = []
        initializing = true,
        self = this;

    assert.object(opts.store);
    this._store = opts.store;
}





exports.SocketList = SocketList;