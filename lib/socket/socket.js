"use strict";

var assert = require('assert-plus'),
    vm = require('vm'),
    defaultMethods = {
        'default': 'hubba.respond({hello: "world"});'
    };

/*
     {
         name: 'event',
         methods: {
             default: '...',
             create: 'function(){...}',
             update: '...'
         }
     }

    Simple class for validating socket resources
 */
function Socket(opts) {
    this._compiledMethods = {};
    this.update(opts);
}

Socket.prototype.validate = function SocketValidate(o){
    if (!this.name) {
        assert.string(o.name,'Socket name');
        if (o.name.indexOf(':') > -1) {
            throw new Error('Invalid socket name \"'+ o.name + '\", socket name cannot contain colons.');
        }
    }
    assert.optionalObject(o.methods,'Socket methods');
};

Socket.prototype.update = function SocketUpdate(opts){
    var o = opts || {};

    this.validate(o);

    this.name = o.name || this.name;

    if (o.methods && Object.keys(o.methods).length) {
        for ( var key in o.methods ) {
            assert.string(o.methods[key],'Socket method ' + key);
            assert.ok((key.trim().length >= 0),'Socket method name must have a value.');
        }
        this.methods = o.methods;
    } else {
        this.methods = defaultMethods;
    }

    for ( var key in this.methods ) {
        this._compiledMethods[key] = vm.createScript("(function(hubba){"+this.methods[key]+"});");
    }

    return this;
};

Socket.prototype.toJSON = function SocketToJSON(){
    return {
        name: this.name,
        methods: this.methods
    };
}

exports.Socket = Socket;