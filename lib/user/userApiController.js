"use strict";
var assert = require('assert-plus'),
    User = require('./user').User;

function UserAPIController(opts) {
    var o = opts || {};
    assert.object(o.userStore,'userStore');
    var _store = o.userStore;

    this.getAll = function(req,res,next){
        var users = [];

        _store.findAll(function userResponseFunction(err,result){
            if (err){
                err.status = 400;
                next(err);
            } else {
                try {
                    result.forEach(function(u){
                        var user = new User(u);
                        users.push(user.toJSON());
                    });
                } catch(e) {
                    e.status = 500;
                    next(e);
                    return;
                }
                res.json(200, users);
            }
        });

    };

    this.get = function(req,res,next){
        var u;

        _store.find(req.params.id, function userResponseFunction(err,user){
            if (err){
                err.status = 404;
                next(err);
            } else {
                res.json(200, user.toJSON());
            }
        });
    };

    this.post = function(req,res,next){
        var u;

        try {
            u = new User(req.body);
        } catch(e) {
            e.status = 400;
            next(e);
            return;
        }

        u.updatePassword(req.body.password, function(err) {

            if (err) {
                err.status = 400;
                next(err);
                return;
            }

            _store.add(u, function userResponseFunction(err,id){
                if (err){
                    err.status = 400;
                    next(err);
                    return;
                }

                u.id = id;
                res.json(200, u.toJSON() );
            });
        });
    };

    this.put = this.patch = function(req,res,next){

        var u;

        try {
            u = new User(req.body);
            u.id = parseInt(req.params.id);
        } catch(e) {
            e.status = 400;
            next(e);
            return;
        }

        function doUpdate(err) {

            if (err) {
                err.status = 400;
                next(err);
                return;
            }

            _store.update(u, function userResponseFunction(err){
                if (err){
                    err.status = 400;
                    next(err);
                } else {
                    res.json(200, u.toJSON());
                }
            });
        }

        if (req.body.password) {
            u.updatePassword(req.body.password, doUpdate);
        } else {
            doUpdate();
        }

    };

    this.del = function(req,res,next){
        _store.remove(parseInt(req.params.id), function userResponseFunction(err){
            if (err){
                err.status = 404;
                next(err);
            } else {
                res.json();
            }
        });
    };

    this.login = function(username,password,done) {
        _store.findByUsername(username, function userResponseFunction(err,user) {
            if (err) {
                done(null,false);
                return;
            }

            user.verifyPassword(password, function(err,valid) {
                if (err || !valid) {
                    done(null,false);
                    return;
                }

                done(null,user.toJSON());
            });

        });
    };

    // check if there are any users
    // if not, assume this is a fresh app and default in an admin account
    _store.count(function(err,result){
        if (err) {
            console.log('Error retrieving user count:');
            console.log(err.stack);
            return;
        }

        if (result === 0) {
            var admin = new User({
                username: 'hubba',
                role: 'admin'
            });
            admin.updatePassword('hubba',function(err){
                if (err) {
                    console.log('Error creating default admin user:');
                    console.log(err.stack);
                    return;
                }

                _store.add(admin, function userResponseFunction(err){
                    if (err) {
                        console.log('Error storing default admin user to database:');
                        console.log(err.stack);
                    }
                });
            })
        }
    });
}

exports.UserAPIController = UserAPIController;