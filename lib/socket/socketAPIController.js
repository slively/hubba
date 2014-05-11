"use strict";
var assert = require('assert-plus');

function SocketAPIController(opts) {
    var o = opts || {};
    assert.object(o.socketList,'socketList');
    var _list = o.socketList;

    this.getAll = function(req,res,next){

        _list.findAll(function socketsResponseFunction(err,result){
            if (err){
                err.status = 400;
                next(err);
            } else {
                res.json(200,result);
            }
        });

    };

    this.get = function(req,res,next){
        _list.find(parseInt(req.params.id), function socketsResponseFunction(err,result){
            if (err){
                err.status = 404;
                next(err);
            } else {
                res.json(200,result);
            }
        });
    };

    this.post = function(req,res,next){
        _list.add(req.body, function socketsResponseFunction(err,result){
            if (err){
                err.status = 400;
                next(err);
            } else {
                res.json(200,result);
            }
        });
    };

    this.put = this.patch = function(req,res,next){
        _list.update(parseInt(req.params.id), req.body, function socketsResponseFunction(err,result){
            if (err){
                err.status = 400;
                next(err);
            } else {
                res.json(200,result);
            }
        });
    };

    this.del = function(req,res,next){
        _list.remove(parseInt(req.params.id), function socketsResponseFunction(err,result){
            if (err){
                err.status = 404;
                next(err);
            } else {
                res.json();
            }
        });
    };
}

exports.SocketAPIController = SocketAPIController;