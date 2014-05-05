var assert = require('assert-plus'),
    AuthStrategyLoader = require('../../../lib/authStrategy/authStrategyLoader').AuthStrategyLoader;

describe('AuthStrategyLoader', function(){

    var rootPath = __dirname+'/mockAuthStrategies',
        mockAuthStrategyFactory = function(opts){
            return {name:opts.name};
        };

    it('should throw an error when path is not valid.',function(done){
        assert.throws(
            function(){
                new AuthStrategyLoader({path:'nope'});
            },
            /path is not valid/
        );
        done();
    });

    it ('should read in the contents of the mockAuthStrategy directory and create an object return the file paths.', function(done){
        var factories = new AuthStrategyLoader({path:rootPath},{AuthStrategyFactory:mockAuthStrategyFactory});
        assert.deepEqual(factories,{
            empty: {
                name: 'empty'
            }
        });
        done();
    });
});