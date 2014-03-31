var assert = require('assert-plus'),
    util = require("util"),
    EventEmitter = require("events").EventEmitter,
    Socket = require('./socket').Socket;

// Responsibilities:
//  Maintain a cached list of Socket resources from the store (file/memory/redis)
//  Validate added/updated socket models
//  Emit all socket update events with a timestamp so the router and other processes/servers can be notified

// Input
//  store: instantiated SocketStore

function SocketList(opts){
    var o = opts || {},
        self = this,
        s;

    EventEmitter.call(this);
    assert.object(o.store);
    this._store = o.store;

    this._store.findAll(function initializeSockets(err,result){
        if(err) {
            // TODO better error stuff
            console.log('Critical Error initializing sockets cache: ');
            console.log(err.stack);
            return;
        }

        result.forEach(function(socket){
            try {
                s = new Socket(socket);
                self.emit('add',s);
            } catch(e) {
                console.log('Critical Error initializing socket \"'+ JSON.stringify(s) + '\" from the database. Will likely need to manually update in database:');
                console.log(e.stack);
            }
        });
    });
}
util.inherits(SocketList, EventEmitter);

SocketList.prototype.find = function SocketListFind(id,cb){
    this._store.find(id,function(err,socket){
        var s;

        if (err) {
            cb(err);
            return;
        }

        try {
            s = new Socket(socket);
            cb(undefined, s.toJSON());
        } catch(e) {
            cb(e);
        }
    });
    return this;
};

SocketList.prototype.findAll = function SocketListFindAll(cb){
    this._store.findAll(function(err,sockets){
        var r = [];

        if (err) {
            cb(err);
            return;
        }

        try {
            sockets.forEach(function(socket){
                var s = new Socket(socket);
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

SocketList.prototype.add = function SocketListAdd(socket,cb){

    var self = this;

    try {
        var temp = new Socket(socket);
    } catch(e) {
        cb(e);
        return this;
    }

    this._store.add(temp,function(err){
        if(err) {
            cb(err);
            return;
        }
        self.emit('add',temp);
        cb(undefined,temp.toJSON());
    });

    return this;
};

SocketList.prototype.update = function SocketListUpdate(id,socket,cb){

    var self = this,
        newSocket;

    try {
        socket.id = id; // just in case
        newSocket = new Socket(socket);
    } catch(e) {
        cb(e);
        return this;
    }

    // update the database
    this._store.replace(newSocket, function(err){
        if(err) {
            cb(err);
            return;
        }

        self.emit('update',newSocket);
        cb(undefined,newSocket.toJSON());
    });

    return this;
};

SocketList.prototype.remove = function SocketListRemove(id,cb){

    var self = this;
    console.log('ID',id);
    // update the database
    this._store.remove(id,function(err){
        if(err) {
            cb(err);
            return;
        }

        self.emit('remove', { id: id });
        cb();
    });

    return this;
};

//find version

exports.SocketList = SocketList;