"use strict";
var assert = require('assert-plus'),
    Test = require('./test').Test,
    TestRunner = require('./testRunner').TestRunner,
    _ = require('lodash');

function TestAPIController(opts) {
    var o = opts || {},
        _store,
        _server,
        _runner;

    assert.object(o.store,'store');
    assert.func(o.server,'server');

    _store = o.store;
    _server = o.server;
    _runner = new TestRunner({ server: _server });

    _server.get('/hubba/api/tests', function(req,res,next){
        var tests = [];

        _store.findAll(function testResponseFunction(err,results){
            if (err){
                err.status = 400;
                next(err);
            } else {
                try {
                    results.forEach(function(t) {
                        tests.push(new Test(t));
                    });
                } catch(e) {
                    e.status = 500;
                    next(e);
                    return;
                }
                res.json(200, tests);
            }
        });

    });

    function findTest(id, cb) {
        _store.find(id, function testResponseFunction(err,test){
            if (err){
                err.status = 404;
                cb(err);
            } else {
                cb(null, new Test(test));
            }
        });
    }

    _server.get('/hubba/api/tests/:id', function(req,res,next){
        findTest(req.params.id, function testResponseFunction(err,test){
            if (err){
                next(err);
            } else {
                res.json(200, test);
            }
        });
    });

    _server.get('/hubba/api/tests/:id/run', function(req,res,next){
        findTest(req.params.id, function testResponseFunction(err,test){
            if (err){
                next(err);
            } else {
                try {
                    _runner.runTest(test, function (err, result) {
                        if (err) {
                            next(err);
                        } else {
                            res.json(200, result);
                        }
                    });
                } catch(e) {
                    e.status = 500;
                    next(e);
                }
            }
        });
    });

    _server.post('/hubba/api/tests', function(req,res,next){
        var t;

        try {
            t = new Test(req.body);
        } catch(e) {
            e.status = 400;
            next(e);
            return;
        }

        _store.add(t, function testResponseFunction(err,id){
            if (err){
                err.status = 400;
                next(err);
                return;
            }

            t.id = id;
            res.json(200, t);
        });
    });

    function putAndPatch(req,res,next){
        var t;

        try {
            t = new Test(req.body);
            t.id = parseInt(req.params.id);
        } catch(e) {
            e.status = 400;
            next(e);
            return;
        }

        _store.replace(t, function testResponseFunction(err){
            if (err){
                err.status = 400;
                next(err);
            } else {
                res.json(200, t);
            }
        });
    }

    _server.put('/hubba/api/tests/:id',putAndPatch);
    _server.patch('/hubba/api/tests/:id',putAndPatch);


    _server.del('/hubba/api/tests/:id', function(req,res,next){
        _store.remove(parseInt(req.params.id), function testResponseFunction(err){
            if (err){
                err.status = 404;
                next(err);
            } else {
                res.json();
            }
        });
    });
}

exports.registerRoutes = function(opts) {
    return new TestAPIController(opts);
};