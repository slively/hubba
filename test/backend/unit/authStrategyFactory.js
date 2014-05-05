

var assert = require('assert-plus'),
    AuthStrategyFactory = require('../../../lib/authStrategy/authStrategyFactory').AuthStrategyFactory,
    passport = require('passport'),
    LocalStrategy = require('passport-local').Strategy;

describe('AuthStrategyFactory', function(){

    it('should throw an error when a name is not defined',function(done){
        assert.throws(
            function(){
                new AuthStrategyFactory();
            },
            /Authenticator name/
        );

        done();
    });

    it('should throw an error when a strategy function is not defined',function(done){
        assert.throws(
            function(){
                new AuthStrategyFactory({
                    name: 'test'
                });
            },
            /Authenticator strategy/
        );

        done();
    });

    it('should throw an error when args array is not defined',function(done){
        assert.throws(
            function(){
                new AuthStrategyFactory({
                    name: 'test',
                    strategy: function(){}
                });
            },
            /Authenticator args array/
        );

        done();
    });

    it('should throw an error when args array does not contain any objects',function(done){
        assert.throws(
            function(){
                new AuthStrategyFactory({
                    name: 'test',
                    strategy: function(){},
                    args: []
                });
            },
            /Authenticator args must have a length > 0/
        );

        done();
    });

    it('should throw an error when args array contains something other than an object',function(done){
        assert.throws(
            function(){
                new AuthStrategyFactory({
                    name: 'test',
                    strategy: function () {
                    },
                    args: ['']
                });
            },
            /Authenticator args array \(object\) is required/
        );

        done();
    });

    it('should throw an error when an arg object does not contain a name',function(done){
        assert.throws(
            function(){
                new AuthStrategyFactory({
                    name: 'test',
                    strategy: function () {
                    },
                    args: [
                        {}
                    ]
                });
            },
            /Authenticator argument name \(string\) is required/
        );

        done();
    });

    describe('toJSON', function() {
        it('should contain all relevant properties',function(done){
            var opts = {
                    name: 'test',
                    strategy: function () {},
                    args: [{name:'name'}],
                    configuration: {
                        text: { inputType: 'text', required: true }
                    }
                },
                s = new AuthStrategyFactory(opts);
            assert.deepEqual(s.toJSON(),opts);
            done();
        });
    });

    describe('configuration', function(){
       it('should throw an error if input type is not text or password',function(done){
           assert.throws(
               function(){
                   new AuthStrategyFactory({
                       name: 'test',
                       strategy: function () {
                       },
                       args: [{name:'name'}],
                       configuration: {
                           number: { inputType: 'number' }
                       }
                   });
               },
               /AuthStrategy test configuration item number has invalid inputType. Must be one of the following:/
           );

           done();
       });
    });

    describe('createStrategy', function(){

        it('should throw an error if name is not defined',function(done){
            var s = new AuthStrategyFactory({
                name: 'test',
                strategy: function () {},
                args: [{name:'name'}],
                configuration: {
                    text: { inputType: 'text' }
                }
            });
            assert.throws(
                function(){
                    s.createStrategy()
                },
                /createStrategy name/
            );

            done();
        });

        it('should throw an error if a configuration item is not a member of the factories configuration',function(done){
            var s = new AuthStrategyFactory({
                name: 'test',
                strategy: function () {},
                args: [{name:'name'}],
                configuration: {
                    text: { inputType: 'text' }
                }
            });
            assert.throws(
                function(){
                    s.createStrategy({
                        name: 'test',
                        configuration: {
                            bad: ''
                        }
                    })
                },
                /createStrategy configuration key 'bad' is not valid, must be one of the following/
            );

            done();
        });

        it('should throw an error if a required configuration item is not present',function(done){
            var s = new AuthStrategyFactory({
                name: 'test',
                strategy: function () {},
                args: [{name:'name'}],
                configuration: {
                    text: { inputType: 'text', required: true }
                }
            });
            assert.throws(
                function(){
                    s.createStrategy({
                        name: 'test',
                        configuration: {}
                    })
                },
                /createStrategy configuration key 'text' is required/
            );

            done();
        });

        it('should instantiate a new strategy successfully',function(done){
            var factory = new AuthStrategyFactory({
                    name: 'test',
                    // this strategy is a basically a mock that assigns it's inputs for testing
                    strategy: function (config,code) {this.config = config; this.code = code;},
                    args: [{name:'name'}],
                    configuration: {
                        text: { inputType: 'text', required: true }
                    }
                }),
                s = factory.createStrategy({
                    name: 'test',
                    configuration: {
                        text:'value'
                    }
                });

            assert.deepEqual(s,[
                "test",
                {
                    "config": {
                        "text":"value"
                    },
                    "code": "function (name,done){}"
                }
            ]);
            done();
        });

        it('should instantiate a new local strategy successfully and be usable by passportjs',function(done){
            var factory = new AuthStrategyFactory({
                    name: 'test',
                    // this strategy is a basically a mock that assigns it's inputs for testing
                    strategy: LocalStrategy,
                    args: [{name:'username'},{name:'password'}]
                }),
                s = factory.createStrategy({
                    name: 'test',
                    configuration: {}
                });

            passport.use.apply(passport,s);
            done();
        });
    });

});