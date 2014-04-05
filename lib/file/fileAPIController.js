"use strict";
var assert = require('assert-plus');

function FileAPIController(opts) {
    var o = opts || {};
    assert.object(o.fileList,'fileList');
    var _list = o.fileList;

    this.getAll = function(req,res,next){

        if (req.query.tree) {
            _list.findAllAsTree(function (err,result){
                if (err){
                    err.status = err.status || 400;
                    next(err);
                } else {
                    res.json(200,result);
                }
            });
        } else {
            _list.findAll(function (err,result){
                if (err){
                    err.status = err.status || 400;
                    next(err);
                } else {
                    res.json(200,result);
                }
            });
        }

    };

    this.get = function(req,res,next){
        _list.find(req.params.id, function (err,result){
            if (err){
                err.status = err.status || 404;
                next(err);
            } else {
                res.json(200,result);
            }
        });
    };

    this.post = function(req,res,next){
        _list.add(req.body, function (err,result){
            if (err){
                err.status = err.status || 400;
                next(err);
            } else {
                res.json(200,result);
            }
        });
    };

    this.put = this.patch = function(req,res,next){
        _list.update(req.params.id, req.body, function (err,result){
            if (err){
                err.status = err.status || 400;
                next(err);
            } else {
                res.json(200,result);
            }
        });
    };

    this.del = function(req,res,next){
        _list.remove(req.params.id, function (err){
            if (err){
                err.status = err.status || 404;
                next(err);
            } else {
                res.json();
            }
        });
    };

    this.renameFolder = function(req,res,next) {
        _list.renameFolder(req.body,function (err,tree) {
            if (err) {
                err.status = err.status || 400;
                next(err);
            } else {
                res.json(200,tree);
            }
        });
    };

    this.removeFolder = function(req,res,next) {
        _list.removeFolder(req.body,function (err) {
            if (err) {
                err.status = err.status || 400;
                next(err);
            } else {
                res.json(200);
            }
        });
    };
}

exports.FileAPIController = FileAPIController;