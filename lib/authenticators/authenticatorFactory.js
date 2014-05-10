"use strict";

var assert = require('assert-plus'),
    vm = require('vm'),
    _ = require('lodash'),
    validInputTypes = ['text','password'],
    defaultCode = '';

/*
    An AuthenticatorFactory and takes an authStrategy (the configuration from a 'hubba-auth-strategy-*' folder) as input.
    Once instantiated the createAuthenticator(options) function can be called to instantiate an authenticator based off the authStrategy.

    Input:
    {
        name: '...',
        strategy: require('passport-something').Strategy,
        args: ['username','password'],
        configuration: {
            myTestField: { inputType: 'text', placeholder:'placeholder', value: 'default', required: false },
            passwordField: { inputType: 'password', value: '' }
        }
    }

    the name should come from the package: hubba-auth-strategy-thename
    the strategy function should come from something like this: require('passport-local').Strategy
    configuration is optional, and fields are required by default

    See the following for more information on configuration: http://passportjs.org/guide/configure/
    This uses named strategies as mentioned here: https://github.com/jaredhanson/passport/issues/50
*/
function AuthenticatorFactory(opts) {
    this.update(opts);
}

AuthenticatorFactory.prototype.validate = function validateDef(opts) {
    var o = opts || {};
    o.configuration = o.configuration || {};

    assert.string(o.name,'AuthenticatorFactory name');
    assert.func(o.strategy,'AuthenticatorFactory strategy');
    assert.arrayOfObject(o.args,'AuthenticatorFactory args array');
    assert.ok(o.args.length,'AuthenticatorFactory args must have a length > 0');

    for ( var i in o.args ) {
        assert.string(o.args[i].name,'AuthenticatorFactory argument name');
    }

    assert.optionalObject(o.configuration,'AuthenticatorFactory configuration');

    _.forOwn(o.configuration, function(value, key) {
        assert.object(value,'AuthenticatorFactory ' + o.name + ' configuration item');

        if (validInputTypes.indexOf(value.inputType) < 0){
            throw new Error('AuthenticatorFactory ' + o.name + ' configuration item ' + key + ' has invalid inputType. Must be one of the following: ' + validInputTypes.join(', '));
        }
    });

    return this;
};

AuthenticatorFactory.prototype.update = function updateDef(opts) {
    var o = opts || {};

    this.validate(o);
    this.name = o.name;
    this.strategy = o.strategy;
    this.args = o.args;
    this.configuration = o.configuration || {};

    return this;
};

AuthenticatorFactory.prototype.toJSON = function toJSONDef() {
    return this;
};



/*
    Creates an object with the 2 things you need to create a new authenticator in the passportjs middleware.
    The configuration for this strategy and a function that can be passed into the passport middleware as an authentication strategy.

    Input:
        configuration: '...'
        code: '...'

    Output:
        An object with the authenticator name and rhe arguments to be passed to passportjs.
        ex./
            var passportAthenticator = factory.bundleAuthenticatorForPassport(authenticator);
            passport.use(passportAthenticator.passportArgs);
 */
AuthenticatorFactory.prototype.bundleAuthenticatorForPassport = function bundleAuthenticatorForPassportDef(opts) {
    var o = opts || {},
        self = this,
        authErrName = '('+this.name+') bundleAuthenticatorForPassport ';

    o.configuration = o.configuration || {};

    assert.string(o.name,authErrName +'name');
    assert.notEqual(o.name,'session','Authenticator name cannot be \'session\'.');
    assert.ok(o.name.toLowerCase().indexOf('hubba') === -1, 'Authenticator name cannot contain \'hubba\'.');
    assert.optionalString(o.code,authErrName +'code');
    assert.optionalObject(o.configuration,authErrName+'configuration');

    // validate only valid properties are assigned and that they are strings
    Object.keys(o.configuration).forEach(function(key){
        assert.ok(self.configuration[key],authErrName +'configuration key \'' + key + '\' is not valid, must be one of the following: ' + Object.keys(self.configuration).join(', '));
        assert.string(o.configuration[key],authErrName +'configuration key');
    });

    // validate required properties are present
    _.forOwn(this.configuration,function(value,key) {
        if (value.required) {
            assert.ok(o.configuration[key],authErrName +'configuration key \'' + key + '\' is required');
        }
    });

    o.code = o.code || defaultCode;

    return {
        name: o.name,
        passportArgs: [
            o.name,
            new this.strategy(
                o.configuration,
                eval("(function(" + _.pluck(this.args, 'name').join() + ",done){" + o.code + "});")
            )
        ]
    };
};

exports.AuthenticatorFactory = AuthenticatorFactory;