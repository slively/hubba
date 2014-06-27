"use strict";
var assert = require('assert-plus');

function ServiceAPIController(opts) {
    var o = opts || {};
    assert.object(o.serviceList,'serviceList');
    var _list = o.serviceList;

    this.getTypes = function(req,res,next){
        _list.getServiceTypes(function(err,result){
            if(err) {
                err.status = 500;
                next(err);
            } else if (req.query.object == 'true'){
                var obj = {};
                result.forEach(function(type){
                    obj[type.name] = type;
                });
                res.json(200,obj);
            } else {
                res.json(200,result);
            }
        });
    };

    this.getAll = function(req,res,next){

            _list.findAll(function (err,result){
                if (err){
                    err.status = 400;
                    next(err);
                } else {
                    res.json(200,result);
                }
            });

    };

    this.get = function(req,res,next){
        _list.find(parseInt(req.params.id), function (err,result){
            if (err){
                err.status = 404;
                next(err);
            } else {
                res.json(200,result);
            }
        });
    };

    this.post = function(req,res,next){
        _list.add(req.body, function (err,result){
            if (err){
                err.status = 400;
                next(err);
            } else {
                res.json(200,result);
            }
        });
    };

    this.put = this.patch = function(req,res,next){
        _list.update(parseInt(req.params.id), req.body, function (err,result){
            if (err){
                err.status = 400;
                next(err);
            } else {
                res.json(200,result);
            }
        });
    };

    this.del = function(req,res,next){
        _list.remove(parseInt(req.params.id), function (err){
            if (err){
                err.status = 404;
                next(err);
            } else {
                res.json();
            }
        });
    };
}

exports.ServiceAPIController = ServiceAPIController;