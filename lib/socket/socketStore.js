"use strict;"

var assert = require('assert-plus'),
    util = require('util'),
    GenericStore = require('./../genericStore').GenericStore,
    fileAdapter = require('./socketStoreFileAdapter').Adapter,
    redisAdapter = require('./socketStoreRedisAdapter');


function SocketStore(opts){
    GenericStore.call(this,opts);
};

util.inherits(SocketStore,GenericStore);

function adapterFunction(method){
    switch(this._type){
        case 'redis':
            return redisAdapter[method];
        default:
            return fileAdapter[method];
    }
}

SocketStore.prototype.connected = adapterFunction('connected');
SocketStore.prototype.find = adapterFunction('find');
SocketStore.prototype.findVersion = adapterFunction('findVersion');
SocketStore.prototype.findAll = adapterFunction('findAll');
SocketStore.prototype.add = adapterFunction('add');
SocketStore.prototype.replace = adapterFunction('replace');
SocketStore.prototype.remove = adapterFunction('remove');

exports.SocketStore = SocketStore;