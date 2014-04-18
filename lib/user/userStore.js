"use strict;"

var assert = require('assert-plus'),
    util = require('util'),
    GenericStore = require('./../genericStore').GenericStore,
    sqliteAdapter = require('./userStoreSQLiteAdapter').Adapter;


function UserStore(opts){
    var o = opts || {};
    o.adapters = {
        memory: sqliteAdapter,
        file: sqliteAdapter,
        redis: {}
    };
    GenericStore.call(this,o);
}

util.inherits(UserStore,GenericStore);

exports.UserStore = UserStore;