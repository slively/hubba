var assert = require('assert-plus'),
    _ = require('lodash');

/*
    The serverConfiguration defines the configuration items will be stored for each app environment.
 */
function ServerConfiguration(opts) {
    this.update(opts);
}

ServerConfiguration.prototype.validate = function UserValidate(opts) {
    var o = opts || {};
    assert.string(o.key,'key');
    assert.string(o.value,'value');

    assert.ok(_.find(ServerConfiguration.DEFAULTS, { key: o.key }),'Invalid server configuration key, must be one of the following: ' + _.pluck(ServerConfiguration.DEFAULTS,'key').join(', '));
};

ServerConfiguration.prototype.update = function UserUpdate(o) {
    this.validate(o);
    this.key = o.key;
    this.value = o.value;
};

ServerConfiguration.prototype.toJSON = function UserToJSON() {
    return {
        key: this.key,
        value: this.value
    };
};

/*
 TODO: session configuration / environment variables / production settings for hubba-admin usage
 */
ServerConfiguration.DEFAULTS = [
    { key: 'SESSION_SECRET', value: 'super secret session secret' },
    { key: 'SESSION_MAX_AGE', value: '604800000' }, // 1 week
    { key: 'SESSION_STORE', value: '' }, // TODO: implement
    { key: 'PORT', value: '8001' },
    { key: 'USER_SERIALIZE', value: 'done(null, {});'},
    { key: 'USER_DESERIALIZE', value: 'done(null, {});'},
    { key: 'LOGGER', value: '' } // TODO: implement
];

exports.ServerConfiguration = ServerConfiguration;
