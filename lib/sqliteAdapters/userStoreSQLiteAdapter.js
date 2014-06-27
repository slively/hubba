var User = require('./../user/user').User;

exports.Adapter = {
    name: 'users',
    connected: function userStoreConnected(d){
        var self = this,
            done = d || function(){};

            self._db.run("CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY, role TEXT NOT NULL, username TEXT NOT NULL UNIQUE, password TEXT NOT NULL);",function(err) {
                done(err);
            });
    },
    count: function userStoreCount(cb) {
        var self = this;

        self._db.all('SELECT count(*) from users;', function (err, result) {
            cb(err,result[0]['count(*)']);
        });
    },
    find: function userStoreFind(id,cb){
        var self = this;

        self._db.all('SELECT * from users where id = ?;',[id],function(err,result){
            var user;

            if (err) {
                cb(err);
                return;
            }

            if (result.length === 0){
                cb(new Error("No users found with id " + id));
                return;
            }

            try {
                user = new User(result[0]);
            } catch(e) {
                cb(e);
                return;
            }

            cb(null,user);
        });
    },
    findByUsername: function userFindByUsername(un,cb) {
        var self = this;

        self._db.all('SELECT * from users where username = ?;',[un],function(err,result){
            var user;

            if (err) {
                cb(err);
                return;
            }

            if (result.length === 0){
                cb(new Error("No users found with username " + un));
                return;
            }

            try {
                user = new User(result[0]);
            } catch(e) {
                cb(e);
                return;
            }

            cb(null,user);
        });
    },
    findAll: function userStoreFindAll(cb){
        var self = this;

        self._db.all('SELECT * from users;',function(err,result){
            cb(err,result);
        });
    },
    add: function userStoreAdd(user,cb){
        var self = this,
            u = {
                $role: user.role,
                $username: user.username,
                $password: user.password
            };

        self._db.run('INSERT into users (role,username,password) VALUES($role,$username,$password);', u, function(err) {
            cb(err,this.lastID);
        });
    },
    update: function userStoreUpdate(user,cb){
        var self = this,
            u = {
                $id: user.id,
                $role: user.role,
                $username: user.username,
                $password: user.password
            },
            fields = [];

        if (user.role) {
            fields.push("role = $role");
        }

        if (user.username) {
            fields.push("username = $username");
        }

        if (user.password) {
            fields.push("password = $password");
        }

        self._db.run('UPDATE users SET '+fields.join()+' WHERE id = $id;', u, function(err) {
            cb(err,this.changes);
        });
    },
    remove: function userStoreRemove(id,cb){
        var self = this;

        self._db.run('DELETE from users where id = ?', [id], function(err){
            cb(err,this.changes);
        });
    }
};