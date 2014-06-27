"use strict";
var assert = require('assert-plus');

function ServerConfigurationAPIController(opts) {
    var o = opts || {};
    assert.object(o.serverConfiguration,'serverConfiguration');
    var _store = o.serverConfiguration;

    this.getAll = function(req,res,next){
        _store.findAll(function configurationResponseFunction(err,result){
            if (err){
                next(err);
            } else {
                res.json(200, result);
            }
        });

    };

    this.get = function(req,res,next) {
        _store.find(req.params.key, function configurationFindResponseFunc(err, result) {
             if (err) {
                next(err);
            } else if (result === undefined) {
                 var e = new Error('Server Configuration with key ' + req.params.key + ' not found.');
                 e.status = 404;
                 next(e);
             } else {
                res.json(200, result);
            }
        });
    };

    this.post = function(req,res,next){
        /*var c;

        try {
            c = new ServerConfiguration(req.body);
        } catch(e) {
            e.status = 400;
            next(e);
            return;
        }

        _store.add(c, function configurationResponseFunction(err){
            if (err){
                err.status = 400;
                next(err);
                return;
            }

            res.json(200, c.toJSON() );
        });*/
        var e = new Error('Currently you cannot add new server configuration items, this will be implemented in the future.');
        e.status = 400;
        next(e);
    };

    this.put = this.patch = function(req,res,next){

        _store.update({
            key: req.params.key,
            value: req.body.value
        }, function configurationResponseFunction(err, c){
            if (err){
                next(err);
            } else {
                res.json(200, c);
            }
        });
    };

    this.del = function(req,res,next){
        /*_store.remove(parseInt(req.params.key), function configurationResponseFunction(err){
            if (err){
                err.status = 404;
                next(err);
            } else {
                res.json();
            }
        });*/
        var e = new Error('Currently you cannot delete server configuration items, this will be implemented in the future.');
        e.status = 400;
        next(e);
    };
}

exports.ServerConfigurationAPIController = ServerConfigurationAPIController;