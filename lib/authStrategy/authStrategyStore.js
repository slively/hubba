"use strict";

var assert = require('assert-plus'),
    util = require('util'),
    GenericStore = require('./../genericStore').GenericStore,
    sqliteAdapter = require('./authStrategyStoreSQLiteAdapter').Adapter;


function AuthStrategyStore(opts,mocks){
    var o = opts || {};
    o.adapters = {
        memory: sqliteAdapter,
        file: sqliteAdapter
    };
    GenericStore.call(this,o);
}

util.inherits(AuthStrategyStore,GenericStore);

exports.AuthStrategyStore = AuthStrategyStore;