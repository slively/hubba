"use strict";
var assert = require('assert-plus');

function AuthenticatorAPIController(opts) {
    var o = opts || {};
    assert.object(o.AuthenticatorList,'AuthenticatorList');
    var _list = o.AuthenticatorList;

    this.getAll = function(req,res,next){

        _list.findAll(function AuthenticatorResponseFunction(err,result){
            if (err){
                err.status = 400;
                next(err);
            } else {
                res.json(200,result);
            }
        });

    };

    this.get = function(req,res,next){
        _list.find(req.params.id, function AuthenticatorResponseFunction(err,result){
            if (err){
                err.status = 404;
                next(err);
            } else {
                res.json(200,result);
            }
        });
    };

    this.post = function(req,res,next){
        _list.add(req.body, function AuthenticatorResponseFunction(err,strategy){
            if (err){
                err.status = 400;
                next(err);
            } else {
                res.json(200,strategy);
            }
        });
    };

    this.put = this.patch = function(req,res,next){
        _list.update(parseInt(req.params.id), req.body, function AuthenticatorResponseFunction(err,result){
            if (err){
                err.status = 400;
                next(err);
            } else {
                res.json(200,result);
            }
        });
    };

    this.del = function(req,res,next){
        _list.remove(parseInt(req.params.id), function AuthenticatorResponseFunction(err,result){
            if (err){
                err.status = 404;
                next(err);
            } else {
                res.json();
            }
        });
    };

    this.getStrategies = function (req,res,next) {
        _list.findStrategies(function AuthenticatorResponseFunction(err,result){
            if (err){
                err.status = 500;
                next(err);
            } else {
                res.json(result);
            }
        });
    };
}

exports.AuthenticatorAPIController = AuthenticatorAPIController;