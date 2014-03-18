"use strict";

var assert = require('assert-plus'),
    invalidFilePaths = ['/api','/sockets'];

/*
 Ensure fields are present and valid:
     id
     path - don't allow '..', should include file name and extension, verify allowed extensions
     contents
 */

function File(opts) {
    this.update(opts);
}

File.prototype.validate = function FileValidate(o){

    if (!this.path) {
        assert.string(o.path,'File path');
    }

    if (o.path) {
        if (o.path.substring(0,1) !== '/') {
            o.path = '/' + o.path;
        }

        if (o.path.indexOf('..') > -1) {
            throw new Error('Invalid file path \"'+ o.path + '\", file path cannot contain \'..\'');
        } else if (o.path.indexOf('.') === -1) {
            // TODO: This needs to be better, there could be a '.' in the folder name. Or does that file from fs.writefile?
            throw new Error('Invalid file path \"'+ o.path + '\", file path must include the file extension.');
        } else {
            invalidFilePaths.forEach(function(badPath){
                if (o.path.substring(0,badPath.length) === badPath) {
                    throw new Error('Invalid file path \"'+ o.path + '\", file path cannot start with ' + badPath);
                }
            });
        }
    }

    // TODO: validate file types

    assert.optionalString(o.contents,'File contents');
};

File.prototype.update = function FileUpdate(opts){
    var o = opts || {};

    this.validate(o);

    this.id = o.id || this.id;
    this.version = o.version || this.version;
    this.path = o.path || this.path;
    this.contents = o.contents || this.contents || '';

    return this;
};

File.prototype.toJSON = function FileToJSON(){
    return {
        id: this.id,
        version: this.version,
        path: this.path,
        contents: this.contents
    };
};

exports.File = File;