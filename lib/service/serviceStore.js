"use strict;"

var assert = require('assert-plus'),
    util = require('util'),
    GenericStore = require('./../genericStore').GenericStore,
    sqliteAdapter = require('./serviceStoreSQLiteAdapter').Adapter,
    redisAdapter = require('./serviceStoreRedisAdapter').Adapter;


function ServiceStore(opts,mocks){
    var o = opts || {};
    o.adapters = {
        memory: sqliteAdapter,
        file: sqliteAdapter,
        redis: redisAdapter
    };
    GenericStore.call(this,o);
}

util.inherits(ServiceStore,GenericStore);

exports.ServiceStore = ServiceStore;