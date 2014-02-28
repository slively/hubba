/**
 * will be instantiated by the server, and pass to the resource http handlers for use
 * will expose optional log store (defaults to console)
 */

"use strict";

var fs = require('fs'),
    assert = require('assert-plus'),
    request = require('request');

function HLogger(opts,mocks){
    var o = opts || {};

    assert.string(o.type); // file or hubba
    assert.string(o.path); // file path or web service path

    try{
        fs.mkdirSync(o.path);
    } catch(e){}

    this.type = o.type;
    this.path = o.path;

    if (o.type === 'off') {
        console.log("logging disabled...");
    }

    this._writeStream = fs.createWriteStream(this.path+'/'+this._getFilename());
}

HLogger.prototype.log = function HLoggerLogFunc(msg) {
    switch(this.type)
    {
        case 'file':
            this._fileLogger(msg);
            break;
        case 'service':
            this._serviceLogger(msg);
            break;
        case 'console':
            console.log(msg);
            break;
    }
    return this;
};

HLogger.prototype._getFilename = function(){
    var d = new Date();
    return (d.getFullYear()+'-0'+(parseInt(d.getMonth())+1)+'-'+d.getDate()).replace('-010-','-10-').replace('-011-','-11-').replace('-012-','-12-') + '.log';
};

HLogger.prototype._fileLogger = function HLoggerFileLogger(msg) {
    var d = (new Date()).toISOString(),
        m = msg;

    if (m !== Object(m)) {
        m = { message: msg };
    }
    m.dateTime = d;
    try {
        fs.appendFile(this.path+'/'+this._getFilename(),JSON.stringify(m)+'\n');
    } catch (e){
        var em  = JSON.stringify({ message: 'Error calling JSON.stringify on log message', dateTime: d }) + '\n';
        fs.appendFile(this.path+'/'+this._getFilename(),em);
    }
};

HLogger.prototype._serviceLogger = function HLoggerFileLogger(msg) {
    // TODO
};


exports.HLogger = HLogger;

