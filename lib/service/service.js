"use strict";

var assert = require('assert-plus'),
    util = require("util"),
    events = require("events"),
    servicePrefix = '/api';

/*
    {
        id: 1,
        version: 1,
        path: '/myserver/...'
    }

    Simple class for validating service resources
 */
function Service(opts) {
    events.EventEmitter.call(this);
    this.update(opts);
}
util.inherits(Service, events.EventEmitter);

Service.prototype.validate = function SocketValidate(opts){
    var o = opts || {};

    if (typeof this.path === 'undefined') {
        assert.string(o.path,'Service path');
    } else {
        assert.optionalString(o.path,'Service path');
    }

    if (typeof this.seq === 'undefined') {
        assert.number(o.seq,'Service sequence');
    } else {
        assert.optionalNumber(o.seq,'Service sequence');
    }
    // TODO: validate path using express?
    this.emit('validate',o);
};

Service.prototype.update = function ServiceUpdate(opts){
    var o = opts || {};

    this.validate(o);

    this.id = o.id || 1;
    this.version = o.version || 1;
    this.path = o.path || this.path;

    if (typeof o.seq !== 'undefined') {
        this.seq = o.seq;
    }

    if (this.path.substring(0,1) !== '/') {
        this.path = '/' + this.path;
    }
    this.emit('update',o);

    return this;
};

Service.prototype.toJSON = function ServiceToJSON(){
    return {
        id: this.id,
        version: this.version,
        path: this.path,
        seq: this.seq
    };
};

exports.Service = Service;