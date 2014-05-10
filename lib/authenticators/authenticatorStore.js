"use strict";

var assert = require('assert-plus'),
    util = require('util'),
    GenericStore = require('./../genericStore').GenericStore,
    sqliteAdapter = require('./authenticatorStoreSQLiteAdapter').Adapter;


function AuthenticatorStore(opts,mocks){
    var o = opts || {};
    o.adapters = {
        memory: sqliteAdapter,
        file: sqliteAdapter
    };
    GenericStore.call(this,o);
}

util.inherits(AuthenticatorStore,GenericStore);

exports.AuthenticatorStore = AuthenticatorStore;