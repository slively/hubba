var assert = require('assert-plus'),
    util = require("util"),
    fs = require('fs'),
    rimraf = require('rimraf'),
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
        self = this,
        numFilesToClean = 0;
        filesCleaned = 0;

    EventEmitter.call(this);
    assert.object(o.store);
    assert.string(o.rootDirectory);

    // validate root is actually an existing directory
    if ( !fs.lstatSync(o.rootDirectory).isDirectory() ) {
        console.log('Error with root directory for file list: ' + o.rootDirectory);
    }

    try {

    } catch(e) {
        console.log('Error deleting files from static file directory:', e.stack);
    }

    this._store = o.store;
    this._cache = {};
    this._rootDirectory = o.rootDirectory;


    // TODO: compute hash and store in database so we don't have to do this on every reboot...
    fs.readdir(o.rootDirectory,clearRootDirectory);

    function clearRootDirectory(err,oldFiles) {
        if (err) {
            console.log('error reading from files directory:',err.stack);
            return;
        }

        numFilesToClean = oldFiles.length;

        if (numFilesToClean) {
            oldFiles.forEach(removeOldFile);
        } else {
            retrieveFilesForWriting();
        }
    }

    function removeOldFile(of) {
        rimraf(self._rootDirectory+'/'+of,function(err){
            if(err){
                console.log('Error deleting old file ' +of);
                console.log(err.stack);
            }

            filesCleaned++;

            // last file removed, now replace with files from database
            if (filesCleaned === numFilesToClean) {
                retrieveFilesForWriting();
            }
        });
    }

    function retrieveFilesForWriting() {
        self._store.findAll({includeContents:true},writeFilesToDisk);
    }

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
        var files = {
            path: '/'
        };

        if (err) {
            cb(err);
            return;
        }

        result.forEach(function(file){
            var cur = files,
                parts = file.path.split("/").slice(1);

            for ( var i = 0; i < parts.length; i++ ) {
                cur[parts[i]] = cur[parts[i]] || {};
                cur[parts[i]].path = '/' + parts.slice(0,i+1).join('/');

                if (i < parts.length - 1){
                    cur = cur[parts[i]];
                } else {
                    cur[parts[i]] = {
                        id: file.id,
                        path: file.path
                    };
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



    self._store.add(newFile.toJSON(),function(err,id){
        if(err) {
            cb(err);
            return;
        }

        writefile(self._rootDirectory+newFile.path,newFile.contents, function(err){
            if (err) {
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
        temp;

    try {
        temp = new File(file);
    } catch(err) {
        cb(err);
        return;
    }

    self._store.replace(temp.toJSON(),function(err,changes){

        var oldFile,
            newFile;

        // db error
        if(err) {
            cb(err);
            return;
        }

        // the sql adapter or database fudged up the data, really bad/wierd if this error happens.
        try {
            oldFile = new File(changes.old);
            newFile = new File(changes.new);
        } catch(e) {
            cb(e);
            return;
        }

        // Is it lazy to rename and re-save after every update?
        // Probably, but it's simple and it will work, with little downside for now.
        fs.rename(self._rootDirectory+oldFile.path, self._rootDirectory+newFile.path, function(err) {

            if(err) {
                cb(err);
                return;
            }

            writefile(self._rootDirectory+newFile.path, newFile.contents, function(err){
                if (err) {
                    cb(err);
                    return;
                }

                self.emit('update',newFile);
                cb(undefined,newFile.toJSON());

            });
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

FileList.prototype.renameFolder = function FileListRenameFolderDef (obj,cb) {
    var self = this,
        e;

    assert.string(obj.oldPath,'oldPath');
    assert.string(obj.newPath,'newPath');

    // folder can only contain 1 slash
    /*var slashes = obj.newPath.split('/');

    if (slashes.length > 2) {
        e = new Error('Folder names can only 1 forward slash, there is no need to enter it when renaming a folder.');
        e.status = 400;
        next(e);
        return;
    } else if (slashes.length === 1) {
        e = new Error('Folder names must contain exactly 1 forward slash.');
        e.status = 400;
        next(e);
        return;
    }*/

    if (obj.newPath.indexOf('..') > -1) {
        e = new Error('Folder names cannot contain \'..\'.');
        e.status = 400;
        cb(e);
        return;
    } else if (obj.newPath.split('/').length != obj.oldPath.split('/').length) {
        e = new Error('Folder name cannot contain \'/\'.');
        e.status = 400;
        cb(e);
        return;
    }

    fs.rename(self._rootDirectory + obj.oldPath, self._rootDirectory + obj.newPath, function fsRenameDef(err){

        if (err){
            cb(err);
            return;
        }

        self._store.renameFolder(obj,function(err2){
            if (err2){
                cb(err2);
                return;
            }

            self.findAllAsTree(cb);
        });
    });
    return this;
};

FileList.prototype.removeFolder = function FileListRemoveFolderDef (obj,cb) {
    var self = this,
        e;

    assert.string(obj.path,'path');

    if (obj.path.indexOf('..') > -1) {
        e = new Error('Folder names cannot contain \'..\'.');
        e.status = 400;
        cb(e);
        return;
    }

    rimraf(self._rootDirectory+obj.path,function(err){
        if(err){
            err.status = 400;
            cb(err);
            return;
        }

        self._store.removeFolder(obj.path,function(err2){
            if (err2){
                cb(err2);
                return;
            }

            cb();
        });
    });
    return this;
};

exports.FileList = FileList;