"use strict;"

var assert = require('assert-plus'),
    util = require('util'),
    GenericStore = require('./../genericStore').GenericStore,
    sqliteAdapter = require('./fileStoreSQLiteAdapter').Adapter,
    redisAdapter = require('./fileStoreRedisAdapter').Adapter;


function FileStore(opts){
    var o = opts || {};
    o.adapters = {
        memory: sqliteAdapter,
        file: sqliteAdapter,
        redis: redisAdapter
    };
    GenericStore.call(this,o);
};

util.inherits(FileStore,GenericStore);

exports.FileStore = FileStore;