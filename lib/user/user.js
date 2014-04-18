var assert = require('assert-plus'),
    easyPbkdf2 = require("easy-pbkdf2")({"DEFAULT_HASH_ITERATIONS":128000}),
    validRoles = ['admin','read-only'];

function User(opts,mocks) {
    this.update(opts);
}

User.prototype.validate = function UserValidate(opts) {
    var o = opts || {};

    if (o.role) {
        assert.ok(validRoles.indexOf(o.role) > -1,'Invalid user role, must be one of the following: ' + validRoles.join(', '));
    }
};

User.prototype.update = function UserUpdate(o) {
    this.validate(o);
    this.id = o.id;
    this.role = o.role;
    this.username = o.username;
    this.password = o.password;
};

// takes a plain-text password as input
User.prototype.updatePassword = function UserUpdatePassword(password, cb) {
    var self = this;

    easyPbkdf2.secureHash( password, function(err, hash, salt ) {
        if (err) {
            cb(err)
        } else {
            self.password = salt + ':' + hash;
            cb();
        }
    });

    return this;
};

User.prototype.verifyPassword = function UserVerifyPassword(password, cb) {
    var self = this,
        seperatorIndex = this.password.indexOf(':');

    easyPbkdf2.verify(  this.password.substring(0,seperatorIndex),
                        this.password.substring(seperatorIndex+1,this.password.length),
                        password,
                        cb);
    return this;
};

User.prototype.toJSON = function UserToJSON() {
    return {
        id: this.id,
        role: this.role,
        username: this.username
    };
};

exports.User = User;