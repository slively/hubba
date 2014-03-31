"use strict;"

var assert = require('assert-plus'),
    util = require("util"),
    EventEmitter = require("events").EventEmitter,
    Service = require('./service').Service,
    ServiceAdapterLoader = require('./../serviceAdapter/serviceAdapterLoader').ServiceAdapterLoader;

// Responsibilities:
//

// Input
//  store: instantiated ServiceStore

function ServiceList(opts){
    var o = opts || {},
        self = this;

    EventEmitter.call(this);
    assert.object(o.store);
    this._store = o.store;
    this._serviceAdapterFactories = new ServiceAdapterLoader({ path: o.serviceAdaptersPath });

    this._store.findAll(function initializeServices(err,result){
        if(err) {
            // TODO better error stuff
            console.log('Critical Error initializing services: ');
            console.log(err.stack);
            return;
        }

        result.forEach(function(service){
            try {
                var s = self._serviceAdapterFactories[service.type].createService(service);
                self.emit('add',s);
            } catch(e) {
                console.log('Critical Error initializing service \"'+ JSON.stringify(s) + '\" from the database. Will likely need to manually update in database:', e.stack);
            }
        });
    });
}
util.inherits(ServiceList, EventEmitter);

ServiceList.prototype.getServiceTypes = function SocketListGetTypes(cb){
    var t = [];

    try {
        for (var key in this._serviceAdapterFactories){
            t.push(this._serviceAdapterFactories[key].toJSON());
        }
    } catch(e){
        cb(e);
    }

    cb(undefined,t);
    return this;
};

ServiceList.prototype.find = function SocketListFind(id,cb){
    var self = this;

    this._store.find(id,function(err,service){
        var s;

        if (err) {
            cb(err);
            return;
        }

        try {
            s = self._serviceAdapterFactories[service.type].createService(service);
            cb(undefined, s.toJSON());
        } catch(e) {
            cb(e);
        }
    });
    return this;
};

ServiceList.prototype.findVersion = function SocketListFindVersion(obj,cb){

    var self = this;

    this._store.findVersion(obj,function(err,service){
        var s;

        if (err) {
            cb(err);
            return;
        }

        try {
            var s = self._serviceAdapterFactories[service.type].createService(service);
            cb(undefined, s.toJSON());
        } catch(e) {
            cb(e);
        }
    });
    return this;
};

ServiceList.prototype.findAll = function SocketListFindAll(cb){
    var self = this;

    this._store.findAll(function(err,services){
        var r = [];

        if (err) {
            cb(err);
            return;
        }

        try {
            services.forEach(function(service){
                var s = self._serviceAdapterFactories[service.type].createService(service);
                r.push(s.toJSON());
            });
        } catch (e) {
            cb(e);
            return;
        }

        cb(undefined,r);
    });

    return this;
};

ServiceList.prototype.add = function SocketListAdd(service,cb){

    var self = this;

    if (typeof this._serviceAdapterFactories[service.type] === 'undefined'){
        cb(new Error('Service type ' + service.type + ' is invalid.'));
        return;
    }

    try {
        var temp = this._serviceAdapterFactories[service.type].createService(service);
    } catch(e) {
        cb(e);
        return this;
    }

    this._store.add(temp,function(err,id){
        if(err) {
            cb(err);
            return;
        }
        temp.id = id;
        self.emit('add',temp);
        cb(undefined,temp.toJSON());
    });

    return this;
};

ServiceList.prototype.update = function ServiceListUpdate(id,service,cb){

    var self = this;

    try {
        var temp = this._serviceAdapterFactories[service.type].createService(service);
        temp.id = id; // just to be sure
    } catch(e) {
        cb(e);
        return this;
    }

    this._store.replace(temp,function(err){
        if(err) {
            cb(err);
            return;
        }
        self.emit('update',temp);
        cb(undefined,temp.toJSON());
    });

    return this;
};

ServiceList.prototype.remove = function ServiceListRemove(id,cb){

    var self = this;

    // update the database
    this._store.remove(id,function(err){
        if(err) {
            cb(err);
            return;
        }

        self.emit('remove', {id:id});
        cb();
    });

    return this;
};

exports.ServiceList = ServiceList;