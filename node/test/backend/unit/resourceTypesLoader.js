var assert = require('assert-plus'),
    ResourceTypesLoader = require('../../../lib/resourceTypesLoader').ResourceTypesLoader;

describe('ResourceTypesLoader', function(){

    var mockResourceTypeFactory = function(opts){
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
        var l = new ResourceTypesLoader({path:__dirname+'/mockResourceType'},{ResourceTypeFactory:mockResourceTypeFactory});
        assert.object(l['mock.js']);
        done();
    });

});