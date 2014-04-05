"use strict;"

var assert = require('assert-plus'),
    util = require('util'),
    GenericStore = require('./../genericStore').GenericStore,
    sqliteAdapter = require('./socketStoreSQLiteAdapter').Adapter,
    redisAdapter = require('./socketStoreRedisAdapter').Adapter;


function SocketStore(opts,mocks){
    var o = opts || {};
    o.adapters = {
        memory: sqliteAdapter,
        file: sqliteAdapter,
        redis: redisAdapter
    };
    GenericStore.call(this,o);
}

util.inherits(SocketStore,GenericStore);

exports.SocketStore = SocketStore;