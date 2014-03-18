var assert = require('assert-plus'),
    util = require("util"),
    fs = require('fs'),
    writefile = require('writefile'),
    EventEmitter = require("events").EventEmitter,
    File = require('./file').File;

// Responsibilities:
//  Maintain a cached list of File resources from the store (file/memory/redis)
//  Validate added/updated File models
//  Emit all File update events with a timestamp so the router and other processes/servers can be notified

// Input
//  store: instantiated FileStore

function FileList(opts){
    var o = opts || {},
        self = this;

    EventEmitter.call(this);
    assert.object(o.store);
    assert.string(o.rootDirectory);

    // validate root is actually an existing directory
    if ( !fs.lstatSync(o.rootDirectory).isDirectory() ) {
        console.log('Error with root directory for file list: ' + o.rootDirectory);
    }

    this._store = o.store;
    this._cache = {};
    this._rootDirectory = o.rootDirectory;
    this._store.findAll({includeContents:true},writeFilesToDisk);

    // TODO: compute hash and store in database so we don't have to do this on every reboot...
    function writeFilesToDisk(err,files) {
        var errors = [];

        if (err) {
            console.log('Error retrieving files from store:'+err.stack);
        }

        files.forEach(function(file){
            writefile(self._rootDirectory+file.path,file.contents,function(err){
                if (err) {
                    console.log('Error writing file:',file.path,'from the database',err.stack);
                }
            });
        });
    }
}
util.inherits(FileList, EventEmitter);


FileList.prototype.find = function FileListFind(id,cb){
    this._store.find(id,cb);
    return this;
};

FileList.prototype.findAll = function FileListFindAll(cb){
    this._store.findAll(cb);
    return this;
};

FileList.prototype.findAllAsTree = function FileListFindAll(cb){
    this._store.findAll(function(err,result){
        var files = {};

        if (err) {
            cb(err);
            return;
        }

        result.forEach(function(file){
            var cur = files,
                parts = file.path.split("/").slice(1);

            for ( var i = 0; i < parts.length; i++ ) {
                cur[parts[i]] = cur[parts[i]] || {};
                if (i < parts.length - 1){
                    cur = cur[parts[i]];
                } else {
                    cur[parts[i]] = file.id;
                }
            }

        });

        cb(undefined,files);
    });
    return this;
};

FileList.prototype.findVersion = function FileListFindVersion(opt,cb){
    var o = opt || {};
    assert.number(o.id,'File id');
    assert.number(o.version,'File version');
    this._store.findVersion(o,cb);
    return this;
};

FileList.prototype.add = function FileListAdd(file,cb){

    var self = this,
        newFile;

    try {
        newFile = new File(file);
    } catch(err) {
        cb(err);
        return;
    }

    writefile(self._rootDirectory+newFile.path,newFile.contents, function(err){
        if (err) {
            cb(err);
            return;
        }

        self._store.add(newFile,function(err,id){
            if(err) {
                cb(err);
                return;
            }
            newFile.id = id;
            newFile.version = 1;
            self.emit('add',newFile);
            cb(undefined,newFile.toJSON());
        });
    });

    return self;
};

FileList.prototype.update = function FileListUpdate(id,file,cb){

    var self = this,
        newFile;

    try {
        newFile = new File(file);
    } catch(err) {
        cb(err);
        return;
    }

    // write to disk to help validate path
    // NOTE: Tt is possible that a file on the disk gets updated before validating,
    //       if there is a duplicate path. The database will still be fine and the user will get an error.
    //       The original file will need to be saved again though. Close enough... ;p
    writefile(self._rootDirectory+newFile.path,newFile.contents, function(err){
        if (err) {
            cb(err);
            return;
        }

        self._store.replace(newFile,function(err){
            if(err) {
                cb(err);
                return;
            }
            self.emit('update',newFile);
            cb(undefined,newFile.toJSON());
        });
    });

    return this;
};

FileList.prototype.remove = function FileListRemove(id,cb){

    var self = this;

    // check that id is valid and get the file path
    self.find(id,function(err,file){

        if (err) {
            cb(err);
            return;
        }

        // remove from disk to help validate
        fs.unlink(self._rootDirectory+file.path, function(err2){

            if (err2) {
                cb(err2);
                return;
            }

            // update the database
            self._store.remove(id,function(err3,changes){
                if(err3) {
                    cb(err3);
                    return;
                }

                self.emit('remove', id);
                cb();
            });
        });
    });

    return this;
};

exports.FileList = FileList;