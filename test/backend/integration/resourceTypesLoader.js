"use strict";

var assert = require('assert-plus'),
    fs = require('fs'),
    ResourceTypesLoader = require('../../../lib/resourceTypesLoader').ResourceTypesLoader,
    rootPath = __dirname+'/../../../lib/ResourceTypes/',
    factories;

describe('ResourceTypesLoader',function(){
    var files = fs.readdirSync(rootPath);

    it('should read in all the standard resource type configurations and create the factories.',function(done){
        factories = new ResourceTypesLoader();
        for (var key in factories){
            assert.ok(files.indexOf(key) > -1);
        }

        done();
    });
/*
    This test is no longer really valid because valid configuration
    is checked up resource creation.
    
    it('should test all of the factories: ',function(done){
        for ( var name in factories ){

            describe(name + ' ResourceTypeFactory', function(){

                var resourceType;

                it ('should instantiate a resourceType successfully.', function(done){
                    resourceType = factories[name].createResource({id:1,name:name,isRoot:true});
                    done();
                });

                it('toJSON should work.',function(done){
                    assert.equal(name,resourceType.toJSON().name);
                    done();
                });
            });

        };
        done();
    });
*/
});