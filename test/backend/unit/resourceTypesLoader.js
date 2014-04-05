var assert = require('assert-plus'),
    ResourceTypesLoader = require('../../../lib/resourceTypesLoader').ResourceTypesLoader;

describe('ResourceTypesLoader', function(){

    var rootPath = __dirname+'/mockResourceTypes',
        mockResourceTypeFactory = function(opts){
            return {name:opts.name};
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
        assert.deepEqual(factories,{
            badConfig: { name: 'badConfig' },
            badConfigCheckboxValue: { name: 'badConfigCheckboxValue' },
            badConfigInputType: { name: 'badConfigInputType' },
            badConfigItem: { name: 'badConfigItem' },
            badConfigItemValue: { name: 'badConfigItemValue' },
            badConfigRadioValue: { name: 'badConfigRadioValue' },
            badConfigRadioValue2: { name: 'badConfigRadioValue2' },
            badConfigSelectMultipleValue: { name: 'badConfigSelectMultipleValue' },
            badConfigSelectMultipleValue2: { name: 'badConfigSelectMultipleValue2' },
            badConfigSelectOptions: { name: 'badConfigSelectOptions' },
            badConfigSelectValue: { name: 'badConfigSelectValue' },
            minMock: { name: 'minMock' },
            mock: { name: 'mock' },
            noResourceType: { name: 'noResourceType' },
            noname: { name: 'noname' }
        });
        done();
    });

});