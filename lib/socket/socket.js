"use strict";

var assert = require('assert-plus'),
    vm = require('vm'),
    defaultCode = 'hubba.respond({hello: "world"});',
    reservedEvents = [
        'connect',
        'connecting',
        'disconnect',
        'connect_failed',
        'error',
        'message',
        'reconnect_failed',
        'reconnect',
        'reconnecting'
    ];

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
    this.update(opts);
}

Socket.prototype.validate = function SocketValidate(o){
    if (!this.name) {
        assert.string(o.name,'Socket name');
        if (o.name.indexOf(':') > -1) {
            throw new Error('Invalid socket name \"'+ o.name + '\", socket name cannot contain colons.');
        }
    }

    if (reservedEvents.indexOf(o.name) > -1) {
        throw new Error('Invalid socket name \"' + o.name + '\", socket name cannot be one of the following: ' + reservedEvents.join(', '));
    }

    assert.optionalNumber(o.id,'Socket id');
    assert.optionalString(o.code,'Socket code');
    assert.optionalBool(o.requiresAuthentication,'Socket requiresAuthentication');
};

Socket.prototype.update = function SocketUpdate(opts){
    var o = opts || {};

    this.validate(o);

    this.id = this.id || o.id;
    this.name = o.name || this.name;
    this.requiresAuthentication = o.requiresAuthentication || false;
    this.code = o.code || this.code || defaultCode;
    this._script = vm.createScript("(function(hubba){"+this.code+"});");

    return this;
};

Socket.prototype.toJSON = function SocketToJSON(){
    return {
        id: this.id,
        name: this.name,
        requiresAuthentication: this.requiresAuthentication,
        code: this.code
    };
};

exports.Socket = Socket;