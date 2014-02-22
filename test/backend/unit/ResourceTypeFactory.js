

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
                    new ResourceTypeFactory({path:__dirname+'/mockResourceTypes/noResourceType/index.js'});
                },
                /does not export ResourceType/
            );
            done();
        });

        it ('should throw an error when the ResourceType file does not define a name.', function(done){
            assert.throws(
                function(){
                    new ResourceTypeFactory({path:__dirname+'/mockResourceTypes/noName/index.js'});
                },
                /name \(string\) is required/
            );
            done();
        });

        it ('should throw an error because configuration is not an object.', function(done){

            assert.throws(
                function() {
                    new ResourceTypeFactory({path:__dirname+'/mockResourceTypes/badConfig/index.js'});
                },
                /configuration \(object\) is required/
            );

            done();
        });

        it ('should throw an error because configuration item is not an object.', function(done){
            assert.throws(
                function(){
                    new ResourceTypeFactory({path:__dirname+'/mockResourceTypes/badConfigItem/index.js'});
                },
                /configuration item \(object\) is required/
            );
            done();
        });

        it ('should throw an error because configuration item does not specify a valid inputType.', function(done){
            assert.throws(
                function(){
                    new ResourceTypeFactory({path:__dirname+'/mockResourceTypes/badConfigInputType/index.js'});
                },
                /has invalid inputType\. Must be one of the following/
            );
            done();
        });

        it ('should throw an error because configuration text item has a default value that is not a string.', function(done){
            assert.throws(
                function(){
                    new ResourceTypeFactory({path:__dirname+'/mockResourceTypes/badConfigItemValue/index.js'});
                },
                /does not have a default value defined/
            );
            done();
        });

        it ('should throw an error because configuration select item options is not an array.', function(done){
            assert.throws(
                function(){
                    new ResourceTypeFactory({path:__dirname+'/mockResourceTypes/badConfigSelectOptions/index.js'});
                },
                /has invalid options/
            );
            done();
        });

        it ('should throw an error because configuration select item has a default value that is not in the options array.', function(done){
            assert.throws(
                function(){
                    new ResourceTypeFactory({path:__dirname+'/mockResourceTypes/badConfigSelectValue/index.js'});
                },
                /has invalid value\. It must be in the options array/
            );
            done();
        });

        it ('should throw an error because configuration selectMultiple item has a default value that is not an array.', function(done){
            assert.throws(
                function(){
                    new ResourceTypeFactory({path:__dirname+'/mockResourceTypes/badConfigSelectMultipleValue/index.js'});
                },
                /has invalid value\. Must be an array for multi-selects/
            );
            done();
        });

        it ('should throw an error because configuration selectMultiple item has a default value that is not in the options array.', function(done){
            assert.throws(
                function(){
                    new ResourceTypeFactory({path:__dirname+'/mockResourceTypes/badConfigSelectMultipleValue2/index.js'});
                },
                /has invalid value\. It must be in the options array/
            );
            done();
        });

        it ('should throw an error because configuration select item options is not an array.', function(done){
            assert.throws(
                function(){
                    new ResourceTypeFactory({path:__dirname+'/mockResourceTypes/badConfigRadioValue/index.js'});
                },
                /has invalid options/
            );
            done();
        });

        it ('should throw an error because configuration radio item has a default value that is not in the options array.', function(done){
            assert.throws(
                function(){
                    new ResourceTypeFactory({path:__dirname+'/mockResourceTypes/badConfigRadioValue2/index.js'});
                },
                /has invalid value\. It must be in the options array/
            );

            done();
        });

        it ('should throw an error because configuration checkbox item has a default value that is not a boolean.', function(done){
            assert.throws(
                function(){
                    new ResourceTypeFactory({path:__dirname+'/mockResourceTypes/badConfigCheckboxValue/index.js'});
                },
                /has invalid value\. Must be an boolean for checkboxes/
            );
            done();
        });
    });

    describe('minimum mock ResourceType',function(){
        var minMockResourceTypeFactory,
            minMockResourceType;

        it ('should successfully read in the minMock/index.js file and inject a mock Resource function.', function(done){
            minMockResourceTypeFactory = new ResourceTypeFactory({path:__dirname+'/mockResourceTypes/minMock/index.js'},{Resource:mockResource});
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

        it ('should successfully read in the mock/index.js file and inject a mock Resource function.', function(done){
            mockResourceTypeFactory = new ResourceTypeFactory({path:__dirname+'/mockResourceTypes/mock/index.js'},{Resource:mockResource,defaultHTTPResponder:mockHTTPResponder});
            done();
        });

        it('should have a toJSON function that returns the correct json representation of the factory.', function(){
            assert.deepEqual(mockResourceTypeFactory.toJSON(),{
                "name": "mock",
                "label": "Mock",
                "filePath": __dirname+"/mockResourceTypes/mock/index.js",
                "configuration": {
                    "defaultText": {
                        "inputType": "text",
                        "value": ""
                    },
                    "optionsText": {
                        "inputType": "text",
                        "placeholder": "placeholder",
                        "value": "default",
                        "required": true
                    },
                    "defaultSelectMultiple": {
                        "inputType": "select",
                        "value": [
                            ""
                        ],
                        "multiple": true,
                        "options": [
                            ""
                        ]
                    },
                    "optionsSelectMultiple": {
                        "inputType": "select",
                        "value": [
                            1,
                            2
                        ],
                        "multiple": true,
                        "options": [
                            1,
                            2
                        ],
                        "placeholder": "placeholder",
                        "required": true
                    },
                    "defaultSelect": {
                        "inputType": "select",
                        "value": "",
                        "options": [
                            ""
                        ]
                    },
                    "optionsSelect": {
                        "inputType": "select",
                        "placeholder": "placeholder",
                        "value": "a",
                        "options": [
                            "a",
                            "b"
                        ],
                        "required": true
                    },
                    "defaultRadio": {
                        "inputType": "radio",
                        "value": "",
                        "options": [
                            ""
                        ]
                    },
                    "optionsRadio": {
                        "inputType": "radio",
                        "header": "header",
                        "value": "a",
                        "options": [
                            "a",
                            "b"
                        ],
                        "required": true
                    },
                    "defaultCheckbox": {
                        "inputType": "checkbox",
                        "value": false
                    },
                    "optionsCheckbox": {
                        "inputType": "checkbox",
                        "header": "header",
                        "value": true
                    },
                    "password": {
                        "inputType": "password",
                        "value": "password"
                    }
                },
                "configurationKeys": [
                    "defaultText",
                    "optionsText",
                    "defaultSelectMultiple",
                    "optionsSelectMultiple",
                    "defaultSelect",
                    "optionsSelect",
                    "defaultRadio",
                    "optionsRadio",
                    "defaultCheckbox",
                    "optionsCheckbox",
                    "password"
                ],
                "wildcardRoute": false
            });
        });

        it ('should instantiate successfully.', function(done){
            mockResourceType = mockResourceTypeFactory.createResource();
            done();
        });

        it ('should have the correctly specified configuration items and label.', function(){
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
                    optionsCheckbox: true,
                    password: ''
                },
                configurationKeys: [
                    'defaultText',
                    'optionsText',
                    'defaultSelectMultiple',
                    'optionsSelectMultiple',
                    'defaultSelect',
                    'optionsSelect',
                    'defaultRadio',
                    'optionsRadio',
                    'defaultCheckbox',
                    'optionsCheckbox',
                    'password'
                ],
                version: undefined,
                isRoot: undefined
            });
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

        it('should fail to validate because optionsText is required',function(done){
            assert.throws(
                function(){
                    mockResourceType.emit('validate',{
                        configuration: {
                            optionsText: ''
                        }
                    });
                },
                /is required/
            );
            done();
        });

        it('should fail to validate because optionsSelectMultiple is required',function(done){
            assert.throws(
                function(){
                    mockResourceType.emit('validate',{
                        configuration: {
                            optionsSelectMultiple: []
                        }
                    });
                },
                /is required/
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

        it ('should have a registered validate event.', function(done){
            assert.ok(mockResourceType.emit('validate'));
            assert.ok(mockResourceType._events['validate'].toString().indexOf('.validate') > -1);
            done();
        });

        it ('should have a registered update event.', function(done){
            assert.ok(mockResourceType.emit('update'));
            assert.ok(mockResourceType._events['update'][1].toString().indexOf('.update') > -1);
            done();
        });

        it ('should have a registered destroy event.', function(done){
            assert.ok(mockResourceType.emit('destroy'));
            assert.ok(mockResourceType._events['destroy'].toString().indexOf('.destroy') > -1);
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