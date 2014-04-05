/**
 * will be instantiated by the server, and pass to the resource http handlers for use
 * will expose optional log store (defaults to console)
 */

"use strict";

var fs = require('fs'),
    assert = require('assert-plus'),
    request = require('request');

function HLogger(opts,mocks){
    var self = this,
        o = opts || {};

    assert.string(o.type); // file or hubba
    assert.string(o.path); // file path or web service path

    // max number of messages to keep around for displaying
    // < 1 keep them all (dev default, dev only)
    // n keep n messages
    assert.optionalNumber(o.queueDepth);

    try{
        fs.mkdirSync(o.path);
    } catch(e){}

    if (o.type === 'off') {
        console.log("logging disabled...");
    }

    this.type = o.type;
    this.path = o.path;
    this._msgQueue = [];
    this._msgQueueDepth = o.queueDepth || 0;

    if (this._msgQueueDepth < 1 && fs.existsSync(this._getFilename())) {
        try {
            var temp = fs.readFileSync(this._getFilename(), { encoding: 'utf8' });
            temp.split('\n').forEach(function(line){
                var tl = line.trim();
                if (tl.trim().length) {
                    try {
                        self._msgQueue.unshift(JSON.parse(tl));
                    } catch(e) {
                        console.log('Error parsing log message - ' + line, e.stack);
                    }
                }
            });
        } catch(e) {
            console.log('Error reading log file:', e.stack);
        }
    }
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
    return this.path + '/' + (d.getFullYear()+'-0'+(parseInt(d.getMonth())+1)+'-'+d.getDate()).replace('-010-','-10-').replace('-011-','-11-').replace('-012-','-12-') + '.log';
};

HLogger.prototype._fileLogger = function HLoggerFileLogger(msg) {
    var d = (new Date()).toISOString(),
        m = msg,
        logMessage;

    if (m !== Object(m)) {
        m = { message: msg };
    }

    m.dateTime = d;
    this._msgQueue.unshift(m);

    try {
        logMessage = JSON.stringify(m)+'\n';
    } catch(e) {
        logMessage = JSON.stringify({ message: 'Error calling JSON.stringify on log message', dateTime: d }) + '\n';
    }

    fs.appendFile(this._getFilename(),logMessage);

    while(this._msgQueueDepth > 0 && this._msgQueue.length > this._msgQueueDepth) {
        this._msgQueue.pop();
    }
};

HLogger.prototype._serviceLogger = function HLoggerFileLogger(msg) {
    // TODO
};

HLogger.prototype.snapshot = function HLoggerSnapshot(cb) {
    assert.func(cb);
    cb(this._msgQueue);
    return this;
};

exports.HLogger = HLogger;

