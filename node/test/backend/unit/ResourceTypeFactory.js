

var assert = require('assert-plus'),
    ResourceTypeFactory = require('../../../lib/resourceTypeFactory').ResourceTypeFactory,
    mockResource = require("events").EventEmitter,
    mockHTTPResponder = function(){};

describe('ResourceTypeFactory', function(){

    it('should throw an error when a file is not defined.',function(done){
        assert.throws(
            function(){
                new ResourceTypeFactory();
            },
            /ResourceType file path/
        );

        done();
    });

    it ('should throw an error when the file does not exist.', function(done){

        assert.throws(
            function(){
                new ResourceTypeFactory({path:'nope'});
            },
            /Failed to call require on 'nope'/
        );

        done();
    });

    describe('Bad ResourceType',function(){

        it ('should throw an error when the ResourceType file exists but does not export ResourceType.', function(done){
            assert.throws(
                function(){
                    new ResourceTypeFactory({path:__dirname+'/mockResourceType/noResourceType.js'});
                },
                /does not export ResourceType/
            );
            done();
        });

        it ('should throw an error when the ResourceType file does not define a name.', function(done){
            assert.throws(
                function(){
                    new ResourceTypeFactory({path:__dirname+'/mockResourceType/noName.js'});
                },
                /name \(string\) is required/
            );
            done();
        });

        it ('should throw an error because configuration is not an object.', function(done){

            assert.throws(
                function() {
                    new ResourceTypeFactory({path:__dirname+'/mockResourceType/badConfig.js'});
                },
                /configuration \(object\) is required/
            );

            done();
        });

        it ('should throw an error because configuration item is not an object.', function(done){
            assert.throws(
                function(){
                    new ResourceTypeFactory({path:__dirname+'/mockResourceType/badConfigItem.js'});
                },
                /configuration item \(object\) is required/
            );
            done();
        });

        it ('should throw an error because configuration item does not specify a valid inputType.', function(done){
            assert.throws(
                function(){
                    new ResourceTypeFactory({path:__dirname+'/mockResourceType/badConfigInputType.js'});
                },
                /has invalid inputType\. Must be one of the following/
            );
            done();
        });

        it ('should throw an error because configuration text item has a default value that is not a string.', function(done){
            assert.throws(
                function(){
                    new ResourceTypeFactory({path:__dirname+'/mockResourceType/badConfigItemValue.js'});
                },
                /does not have a default value defined/
            );
            done();
        });

        it ('should throw an error because configuration select item options is not an array.', function(done){
            assert.throws(
                function(){
                    new ResourceTypeFactory({path:__dirname+'/mockResourceType/badConfigSelectOptions.js'});
                },
                /has invalid options/
            );
            done();
        });

        it ('should throw an error because configuration select item has a default value that is not in the options array.', function(done){
            assert.throws(
                function(){
                    new ResourceTypeFactory({path:__dirname+'/mockResourceType/badConfigSelectValue.js'});
                },
                /has invalid value\. It must be in the options array/
            );
            done();
        });

        it ('should throw an error because configuration selectMultiple item has a default value that is not an array.', function(done){
            assert.throws(
                function(){
                    new ResourceTypeFactory({path:__dirname+'/mockResourceType/badConfigSelectMultipleValue.js'});
                },
                /has invalid value\. Must be an array for multi-selects/
            );
            done();
        });

        it ('should throw an error because configuration selectMultiple item has a default value that is not in the options array.', function(done){
            assert.throws(
                function(){
                    new ResourceTypeFactory({path:__dirname+'/mockResourceType/badConfigSelectMultipleValue2.js'});
                },
                /has invalid value\. It must be in the options array/
            );
            done();
        });

        it ('should throw an error because configuration select item options is not an array.', function(done){
            assert.throws(
                function(){
                    new ResourceTypeFactory({path:__dirname+'/mockResourceType/badConfigRadioValue.js'});
                },
                /has invalid options/
            );
            done();
        });

        it ('should throw an error because configuration radio item has a default value that is not in the options array.', function(done){
            assert.throws(
                function(){
                    new ResourceTypeFactory({path:__dirname+'/mockResourceType/badConfigRadioValue2.js'});
                },
                /has invalid value\. It must be in the options array/
            );

            done();
        });

        it ('should throw an error because configuration checkbox item has a default value that is not a boolean.', function(done){
            assert.throws(
                function(){
                    new ResourceTypeFactory({path:__dirname+'/mockResourceType/badConfigCheckboxValue.js'});
                },
                /has invalid value\. Must be an boolean for checkboxes/
            );
            done();
        });
    });

    describe('minimum mock ResourceType',function(){
        var minMockResourceTypeFactory,
            minMockResourceType;

        it ('should successfully read in the minMock.js file and inject a mock Resource function.', function(done){
            minMockResourceTypeFactory = new ResourceTypeFactory({path:__dirname+'/mockResourceType/minMock.js'},{Resource:mockResource});
            done();
        });

        it ('should instantiate successfully.', function(done){
            minMockResourceType = minMockResourceTypeFactory.createResource();
            done();
        });
    });


    describe('mock ResourceType',function(){
        var mockResourceTypeFactory,
            mockResourceType;

        it ('should successfully read in the mock.js file and inject a mock Resource function.', function(done){
            mockResourceTypeFactory = new ResourceTypeFactory({path:__dirname+'/mockResourceType/mock.js'},{Resource:mockResource,defaultHTTPResponder:mockHTTPResponder});
            done();
        });

        it ('should instantiate successfully.', function(done){
            mockResourceType = mockResourceTypeFactory.createResource();
            done();
        });

        it ('should have the correctly specified configuration items and label.', function(done){
            assert.deepEqual(mockResourceType.toJSON(),{
                id: undefined,
                name: undefined,
                parentId: undefined,
                path: undefined,
                type: 'mock',
                typeLabel: 'Mock',
                configuration: {
                    defaultText: '',
                    optionsText: 'default',
                    defaultSelectMultiple: [ '' ],
                    optionsSelectMultiple: [ 1, 2 ],
                    defaultSelect: '',
                    optionsSelect: 'a',
                    defaultRadio: '',
                    optionsRadio: 'a',
                    defaultCheckbox: false,
                    optionsCheckbox: true
                }
            });
            done();
        });

        it ('should throw an error trying to validate the configuration because the configuration is not an object.', function(done){
            assert.throws(
                function(){
                    mockResourceType.emit('validate',{configuration:'This should be an object.'});
                },
                /Resource configuration/
            );
            done();
        });

        it ('should fail to validate the configuration because of an unknown item.', function(done){
            assert.throws(
                function(){
                    mockResourceType.emit('validate',{configuration:{unknown:123}});
                },
                /This resource type does not have a configuration item called/
            );

            done();
        });

        it('should fail to validate a new configuration because optionsText has an invalid value.',function(done){
            assert.throws(
                function(){
                    mockResourceType.emit('validate',{
                        configuration: {
                            optionsText:123
                        }
                    });
                },
                /must be of type/
            );
            done();
        });

        it('should fail to validate a new configuration because optionsSelectMultiple has an invalid value.',function(done){
            assert.throws(
                function(){
                    mockResourceType.emit('validate',{
                        configuration: {
                            optionsSelectMultiple: [ 3 ]
                        }
                    });
                },
                /has an invalid value/
            );
            done();
        });

        it('should successfully validate a new configuration.',function(done){
            mockResourceType.emit('validate',{
                configuration: {
                    optionsText:"updated",
                    optionsSelectMultiple: [ 1 ],
                    optionsSelect: 'b',
                    optionsRadio: 'b',
                    optionsCheckbox: false
                }
            });
            done();
        });

        it('should successfully update to the new configuration.',function(done){
            mockResourceType.emit('update',{
                configuration: {
                    optionsText:"updated",
                    optionsSelectMultiple: [ 1 ],
                    optionsSelect: 'b',
                    optionsRadio: 'b',
                    optionsCheckbox: false
                }
            });
            assert.equal(mockResourceType.configuration.optionsText,'updated');
            assert.equal(mockResourceType.configuration.optionsSelectMultiple[0],1);
            assert.equal(mockResourceType.configuration.optionsSelectMultiple[1],undefined);
            assert.equal(mockResourceType.configuration.optionsSelect,'b');
            assert.equal(mockResourceType.configuration.optionsRadio,'b');
            assert.equal(mockResourceType.configuration.optionsCheckbox,false);
            done();
        });


        it ('should have a registered init event.', function(done){
            assert.ok(mockResourceType.emit('init'));
            assert.ok(mockResourceType._events['init'].toString().indexOf('var init = true;') > -1);
            done();
        });

        it ('should have a registered validate event.', function(done){
            assert.ok(mockResourceType.emit('validate'));
            assert.ok(mockResourceType._events['validate'].toString().indexOf('var validate = true;') > -1);
            done();
        });

        it ('should have a registered update event.', function(done){
            assert.ok(mockResourceType.emit('update'));
            assert.ok(mockResourceType._events['update'][1].toString().indexOf('var update = true;') > -1);
            done();
        });

        it ('should have a registered destroy event.', function(done){
            assert.ok(mockResourceType.emit('destroy'));
            assert.ok(mockResourceType._events['destroy'].toString().indexOf('var destroy = true;') > -1);
            done();
        });

        it ('should have a registered GET,POST,PUT,PATCH,DELETE http functions.', function(done){
            var cnt = 0,
                res = {
                    send: function(str){
                        assert.equal(str,'Woo!');
                        if (++cnt == 5){
                            done();
                        }
                    }
                }
            mockResourceType.http.GET(undefined,res);
            mockResourceType.http.POST(undefined,res);
            mockResourceType.http.PUT(undefined,res);
            mockResourceType.http.PATCH(undefined,res);
            mockResourceType.http.DELETE(undefined,res);
        });

    });

});