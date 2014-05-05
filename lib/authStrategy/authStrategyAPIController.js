"use strict";
var assert = require('assert-plus');

function AuthStrategyAPIController(opts) {
    var o = opts || {};
    assert.object(o.AuthStrategyList,'AuthStrategyList');
    var _list = o.AuthStrategyList;

    this.getAll = function(req,res,next){

        _list.findAll(function AuthStrategyResponseFunction(err,result){
            if (err){
                err.status = 400;
                next(err);
            } else {
                res.json(200,result);
            }
        });

    };

    this.get = function(req,res,next){
        _list.find(req.params.id, function AuthStrategyResponseFunction(err,result){
            if (err){
                err.status = 404;
                next(err);
            } else {
                res.json(200,result);
            }
        });
    };

    this.post = function(req,res,next){
        _list.add(req.body, function AuthStrategyResponseFunction(err,strategy){
            if (err){
                err.status = 400;
                next(err);
            } else {
                res.json(200,strategy);
            }
        });
    };

    this.put = this.patch = function(req,res,next){
        _list.update(parseInt(req.params.id), req.body, function AuthStrategyResponseFunction(err,result){
            if (err){
                err.status = 400;
                next(err);
            } else {
                res.json(200,result);
            }
        });
    };

    this.del = function(req,res,next){
        _list.remove(parseInt(req.params.id), function AuthStrategyResponseFunction(err,result){
            if (err){
                err.status = 404;
                next(err);
            } else {
                res.json();
            }
        });
    };
}

exports.AuthStrategyAPIController = AuthStrategyAPIController;