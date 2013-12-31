var assert = require('assert-plus'),
    ResourceTypesLoader = require('../../../lib/resourceTypesLoader').ResourceTypesLoader;

describe('ResourceTypesLoader', function(){

    var rootPath = __dirname+'/mockResourceType',
        mockResourceTypeFactory = function(opts){
            return {name:opts.path};
        };

    it('should throw an error when path is not valid.',function(done){
        assert.throws(
            function(){
                new ResourceTypesLoader({path:'nope'});
            },
            /path is not valid/
        );
        done();
    });

    it ('should read in the contents of the mockResourceType directory and create an object return the file paths.', function(done){
        var factories = new ResourceTypesLoader({path:rootPath},{ResourceTypeFactory:mockResourceTypeFactory});
        assert.object(factories[rootPath+'/mock.js']);
        done();
    });

});