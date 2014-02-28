"use strict;"

var assert = require('assert-plus');

/*
    Generic stor interface used for resources, sockets, or anything else.
    Should do checking to make sure database connection is established,
    and that for each type of client the correct functionality is available.
 */
function GenericStore(opts){
    var o = opts || {};

    assert.string(o.type);
    assert.object(o.db);
    this._type = o.type;
    this._db = o.db;
};

exports.GenericStore = GenericStore;