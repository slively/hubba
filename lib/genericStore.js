"use strict;"

var assert = require('assert-plus'),
    requiredAdapters = ['file','memory','redis'],
    requiredAdapterFunctions = ['connected','find','findAll','findVersion','add','replace','remove'];

/*
    Generic store interface used for resources, sockets, or anything else.
    Should validate that for each type of client the correct functionality is available.
    Each adapter type must be defined when inherited so they are available during instantiation.
 */
function GenericStore(opts){
    var o = opts || {},
        aCnt = 0
        afCnt = 0;

    assert.string(o.type,'Storage type');
    assert.ok(requiredAdapters.indexOf(o.type) > -1,'Storage type of '+ o.type +'is invalid, it must be one of the following: '+requiredAdapters.join(', '));
    assert.object(o.db,'db object is required');
    assert.object(o.adapters,'adapters');
    Object.keys(o.adapters).forEach(function(key){
        //if ( requiredAdapters.indexOf(key) > -1 ) {
            assert.object(o.adapters[key],'Adapters must be objects '+key+' is invalid');

            //afCnt = 0;
            Object.keys(o.adapters[key]).forEach(function(f){
                if ( requiredAdapterFunctions.indexOf(f) > -1 ) {
            //        assert.func(o.adapters[key][f],'Adapters functions must be functions ' + f + ' is invalid.');
                    afCnt++;
                }
            });
            //assert.ok(afCnt === requiredAdapterFunctions.length,'Invalid adapter type functions for adapter ' + key + ', all of the following and only the following must be defined: ' + requiredAdapterFunctions.join(', '));

            aCnt++;
        //} else {
        //    throw new Error('Invalid adapter type: '+key);
        //}
    });
//    assert.ok(aCnt === requiredAdapters.length,'Invalid adapter types, all of the following must be defined: ' + requiredAdapters.join());
    this._type = o.type;
    this._db = o.db;
    this._adapters = o.adapters;

    for ( var key in this._adapters[this._type] ){
        this[key] = this._adapters[this._type][key];
    }
}

exports.GenericStore = GenericStore;