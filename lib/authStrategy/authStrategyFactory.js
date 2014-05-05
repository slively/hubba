"use strict";

var assert = require('assert-plus'),
    vm = require('vm'),
    _ = require('lodash'),
    validInputTypes = ['text','password'],
    defaultCode = '';

/*
    An authStrategyFactory and takes the configuration from a 'hubba-auth-strategy-*' folder as input.
    Once instantiated the createAuthenticator(options) function can be called to instantiate an authenticator
    based off the folder configuration.

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
function AuthStrategyFactory(opts) {
    this.update(opts);
}

AuthStrategyFactory.prototype.validate = function validateDef(opts) {
    var o = opts || {};
    o.configuration = o.configuration || {};

    assert.string(o.name,'Authenticator name');
    assert.func(o.strategy,'Authenticator strategy');
    assert.arrayOfObject(o.args,'Authenticator args array');
    assert.ok(o.args.length,'Authenticator args must have a length > 0');

    for ( var i in o.args ) {
        assert.string(o.args[i].name,'Authenticator argument name');
    }

    assert.optionalObject(o.configuration,'Authenticator configuration');

    _.forOwn(o.configuration, function(value, key) {
        assert.object(value,'AuthStrategy ' + o.name + ' configuration item');

        if (validInputTypes.indexOf(value.inputType) < 0){
            throw new Error('AuthStrategy ' + o.name + ' configuration item ' + key + ' has invalid inputType. Must be one of the following: ' + validInputTypes.join(', '));
        }
    });

    return this;
};

AuthStrategyFactory.prototype.update = function updateDef(opts) {
    var o = opts || {};

    this.validate(o);
    this.name = o.name;
    this.strategy = o.strategy;
    this.args = o.args;
    this.configuration = o.configuration || {};

    return this;
};

AuthStrategyFactory.prototype.toJSON = function toJSONDef() {
    return this;
};



/*
    Creates an object with the 2 things you need to create a new strategy implementation in the passportjs middleware.
    The configuration for this strategy and a function that can be passed into the passport middleware as an authentication strategy.

    Input:
        configuration: '...'
        code: '...'

    Output:
        The arguments to be passed to passportjs.
        ex./ passport.use.apply(passport,factory.bundleStrategyForPassport(...));
 */
AuthStrategyFactory.prototype.bundleStrategyForPassport = function createStrategyDef(opts) {
    var o = opts || {},
        self = this,
        authErrName = '('+this.name+') bundleStrategyForPassport ';

    o.configuration = o.configuration || {};

    assert.string(o.name,authErrName +'name');
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

    return [
        this.name,
        new this.strategy(
            o.configuration,
            eval("(function("+ _.pluck(this.args, 'name').join() + ",done){"+o.code+"});")
        )
    ];
};

exports.AuthStrategyFactory = AuthStrategyFactory;