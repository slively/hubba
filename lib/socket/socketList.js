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
        self = this;

    EventEmitter.call(this);
    assert.object(o.store);
    this._store = o.store;
    this._cache = {};

    this._store.findAll(function initializeCache(err,result){
        if(err) {
            // TODO better error stuff
            console.log('Critical Error initializing sockets cache: ');
            console.log(err.stack);
            return;
        }

        var list = [];

        result.forEach(function(s){
            try {
                self._cache[s.name] = new Socket(s);
                list.push(self._cache[s.name]);
            } catch(e) {
                console.log('Critical Error initializing socket \"'+ JSON.stringify(s) + '\" from the database. Will likely need to manually update in database:');
                console.log(e);
            }
        });

        self.emit('init',list);
    });
}
util.inherits(SocketList, EventEmitter);

SocketList.prototype.find = function SocketListFind(name,cb){
    if (this._cache[name]){
        cb(undefined,this._cache[name].toJSON());
    } else {
        cb(new Error('Socket could not be found with name: ' + name));
    }
    return this;
};

SocketList.prototype.findAll = function SocketListfindAll(cb){
    var r = [];

    for (var key in this._cache){
        r.push(this._cache[key].toJSON());
    }

    cb(undefined,r);

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

    if (this._cache[temp.name]) {
        cb(new Error('A socket with the name ' + temp.name + ' already exists. Names must be unique.'));
        return this;
    }

    this._store.add(temp,function(err){
        if(err) {
            cb(err);
            return;
        }
        self._cache[temp.name] = temp;
        self.emit('add',temp);
        cb(undefined,temp.toJSON());
    });

    return this;
};

SocketList.prototype.update = function SocketListUpdate(name,socket,cb){

    var self = this,
        s = this._cache[name],
        newSocket = new Socket(s.toJSON());

    // verify it exists in the current cache
    if (s) {

        // call socket update method
        try {
            newSocket.update(socket);
        } catch(e) {
            cb(e);
            return this;
        }

        // update the database
        this._store.replace(s,function(err,changes){
            if(err) {
                cb(err);
                return;
            }

            self._cache[name] = newSocket;
            self.emit('update',newSocket)
            delete s;
            cb(undefined,s.toJSON());
        });

    } else {
        cb(new Error('Socket could not be found with name: ' + name));
    }

    return this;
};

SocketList.prototype.remove = function SocketListRemove(name,cb){

    var self = this,
        s = this._cache[name];

    // verify it exists in the current cache
    if (s) {

        // update the database
        this._store.remove(name,function(err,changes){
            if(err) {
                cb(err);
                return;
            }

            delete self._cache[s.name];
            self.emit('remove', s.name);
            cb();
        });

    } else {
        cb(new Error('Socket could not be found with name: ' + name));
    }

    return this;
};

//find version

exports.SocketList = SocketList;