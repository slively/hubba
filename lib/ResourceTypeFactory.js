/*
    Creates ResourceType classes that inherit from Resource.
    The extra functionality revolves around the configuration items which are read in from a file.
 */

var assert = require('assert-plus'),
    util = require('util'),
    rResource = require('./resource').Resource,
    validInputTypes = ['text','select','selectMultiple','radio','checkbox','password','number'],
    rdefaultHTTPResponder = function(req,res){res.send(404);};

function ResourceTypeFactory(opts, mocks){
    var opts = opts || {},
        mocks = mocks || {},
        ResourceType,
        Resource = mocks.Resource || rResource,
        defaultHTTPResponder = mocks.defaultHTTPResponder || rdefaultHTTPResponder;
        defaultResourceTypeConfiguration = {},
        filePath = opts.path;

    assert.string(filePath,'ResourceType file path');
    this.filePath = filePath;

    try{
        ResourceType = require(filePath).ResourceType;
    } catch(e){
        throw 'Failed to call require on \'' + filePath + '\': ' + e.stack;
    }

    assert.object(ResourceType,'ResourceType ' + this.filePath + ' does not export ResourceType');
    assert.string(ResourceType.name,'ResourceType ' + this.filePath + ' name');
    this.name = ResourceType.name;
    this.label = ResourceType.label || this.name;

    assert.optionalFunc(ResourceType.init);
    assert.optionalFunc(ResourceType.validate);
    assert.optionalFunc(ResourceType.update);
    assert.optionalFunc(ResourceType.destroy);

    assert.optionalFunc(ResourceType.GET);
    assert.optionalFunc(ResourceType.POST);
    assert.optionalFunc(ResourceType.PUT);
    assert.optionalFunc(ResourceType.PATCH);
    assert.optionalFunc(ResourceType.DELETE);


    assert.object(ResourceType.configuration,'ResourceType ' + this.filePath + ' configuration');

    for (var key in ResourceType.configuration){

        assert.object(ResourceType.configuration[key],'ResourceType ' + this.filePath + ' configuration item')

        if (validInputTypes.indexOf(ResourceType.configuration[key].inputType) < 0){

            throw new Error('ResourceType ' + this.filePath + ' configuration item ' + key + ' has invalid inputType. Must be one of the following: ' + validInputTypes.toString());

        } else if (typeof ResourceType.configuration[key].value === "undefined"){

            throw new Error('ResourceType ' + this.filePath + ' configuration item ' + key + ' for resource ' + ResourceType.name + ' does not have a default value defined, this is required.');

        } else if (['select','radio'].indexOf(ResourceType.configuration[key].inputType) > -1){

            assert.ok(toString.call(ResourceType.configuration[key].options) == '[object Array]','ResourceType ' + this.filePath + ' configuration item ' + key + ' has invalid options. Must be an array for selects.');

            if (ResourceType.configuration[key].inputType == 'select' && ResourceType.configuration[key].multiple === true){

                assert.ok(toString.call(ResourceType.configuration[key].value) == '[object Array]','ResourceType ' + this.filePath + ' configuration item ' + key + ' has invalid value. Must be an array for multi-selects.');

                for ( var i in ResourceType.configuration[key].value){
                    assert.ok(ResourceType.configuration[key].options.indexOf(ResourceType.configuration[key].value[i]) > -1,'ResourceType ' + this.filePath + ' configuration item ' + key + ' has invalid value. It must be in the options array.')
                }

            } else {
                assert.ok(ResourceType.configuration[key].options.indexOf(ResourceType.configuration[key].value) > -1,'ResourceType ' + this.filePath + ' configuration item ' + key + ' has invalid value. It must be in the options array.')
            }
        } else if (ResourceType.configuration[key].inputType == 'checkbox'){
            assert.bool(ResourceType.configuration[key].value,'ResourceType ' + this.filePath + ' configuration item ' + key + ' has invalid value. Must be an boolean for checkboxes.');
        }
    }

    this.wildcardRoute = false;
    if (ResourceType.wildcardRoute === true){
        this.wildcardRoute = true;
    }

    this.configuration = ResourceType.configuration;

    var thisFactory = this,
        ResourceTypeFunction = function(cfg){

            Resource.call(this,cfg);

            var self = this;

            this.ResourceTypeFactory = thisFactory.toJSON();
            this.type = this.ResourceTypeFactory.name;
            this.typeLabel = this.ResourceTypeFactory.label;
            this.configuration = {};
            this.data = {};

            Object.keys(this.ResourceTypeFactory.configuration).forEach(function(key){
                self.configuration[key] = self.ResourceTypeFactory.configuration[key].value;
            });

            this.validateConfiguration(cfg);
            this.updateConfiguration(cfg);

            this.on('validate',this.validateConfiguration);
            this.on('validate',function(){
                if (ResourceType.validate){
                    ResourceType.validate(self.toJSON({internal:true}));
                }
            });
            this.on('update',this.updateConfiguration);
            this.on('update',function(){
                if (ResourceType.update){
                    ResourceType.update(self.toJSON({internal:true}));
                }
            });
            if(this.ResourceTypeFactory.wildcardRoute){
                this.path+='(.*)';
                this.on('update:path',function(){
                    this.path+='(.*)';
                });
            }
            this.on('destroy',function(){
                if (ResourceType.destroy){
                    ResourceType.destroy(self.toJSON({internal:true}));
                }
            });

            this.http = {
                GET: defaultHTTPResponder,
                POST: defaultHTTPResponder,
                PUT: defaultHTTPResponder,
                PATCH: defaultHTTPResponder,
                DELETE: defaultHTTPResponder
            };

            var self = this;

            if (ResourceType.GET){
                this.http.GET = function(req,res,iternalClient){
                    ResourceType.GET(self.toJSON({internal:true}),req,res,iternalClient);
                }
            }

            if (ResourceType.POST){
                this.http.POST = function(req,res,iternalClient){
                    ResourceType.POST(self.toJSON({internal:true}),req,res,iternalClient);
                }
            }

            if (ResourceType.PUT){
                this.http.PUT = function(req,res,iternalClient){
                    ResourceType.PUT(self.toJSON({internal:true}),req,res,iternalClient);
                }
            }

            if (ResourceType.PATCH){
                this.http.PATCH = function(req,res,iternalClient){
                    ResourceType.PATCH(self.toJSON({internal:true}),req,res,iternalClient);
                }
            }

            if (ResourceType.DELETE){
                this.http.DELETE = function(req,res,iternalClient){
                    ResourceType.DELETE(self.toJSON({internal:true}),req,res,iternalClient);
                }
            }

            if (ResourceType.init){
                ResourceType.init(self.toJSON({internal:true}));
            }
        };

    util.inherits(ResourceTypeFunction, Resource);

    ResourceTypeFunction.prototype.validateConfiguration = ResourceTypeValidateConfiguration;
    ResourceTypeFunction.prototype.updateConfiguration = ResourceTypeUpdateConfiguration;
    ResourceTypeFunction.prototype.toJSON = ResourceTypeToJSON;

    this.createResource = function createResource(opt){
        return new ResourceTypeFunction(opt);
    };

    return this;
};

ResourceTypeFactory.prototype.toJSON = function() {
    return {
        name: this.name,
        label: this.label,
        filePath: this.filePath,
        configuration: this.configuration,
        wildcardRoute: this.wildcardRoute
    };
};

function ResourceTypeValidateConfiguration(update){
    var r = update || {},
        cfg = r.configuration;

    assert.optionalObject(cfg, 'Resource configuration');

    if (cfg){
        for ( var key in cfg ){
            // only add configuration items defined in the resource type
            if (typeof this.ResourceTypeFactory.configuration[key] == 'undefined'){
                throw "This resource type does not have a configuration item called " + key +".";

            // make sure they have the same type
            //	TODO, check more specifically for types like email, number ranges, colors, etc...
            } else if ( Object.prototype.toString.call(this.ResourceTypeFactory.configuration[key].value) != Object.prototype.toString.call(cfg[key]) ){
                throw key + " must be of type " + Object.prototype.toString.call(this.ResourceTypeFactory.configuration[key].value) + ", instead is of type " + Object.prototype.toString.call(cfg[key]) + ".";

            } else if (Array.isArray(cfg[key])){
                for ( var i in cfg[key]){
                    assert.ok(this.ResourceTypeFactory.configuration[key].options.indexOf(cfg[key][i]) > -1,'Configuration item ' + key + ' has an invalid value. These are the valid options: ' + this.ResourceTypeFactory.configuration[key].options.toString());
                }
            }
        }
    }
};

function ResourceTypeUpdateConfiguration(updates){
    var r = updates || {},
        cfg = r.configuration;

    for ( var key in cfg ){
        this.configuration[key] = cfg[key];
    }
};

function ResourceTypeToJSON(opts){
    var o = opts || {},
        j = {
            id: this.id,
            name: this.name,
            type: this.type,
            typeLabel: this.typeLabel,
            parentId: this.parentId,
            path:this.path,
            configuration: {}
        };

    if (o.internal === true){
        j.data = this.data;
        j.http = this.http;
    }

    for ( var key in this.configuration ){
        // when a web service calls toJSON on a resource we want to make sure we don't expose passwords.
        if (this.ResourceTypeFactory.configuration[key].inputType === 'password' && o.internal !== true){
            j.configuration[key] = '';
        } else {
            j.configuration[key] = this.configuration[key];
        }
    }

    if (o.includeChildren === true){
        j.children = {};
        for ( var i in this.children ){
            j.children[i] = this.children[i].toJSON({includeChildren:true});
        }
    }

    return j;
};

exports.ResourceTypeFactory = ResourceTypeFactory;