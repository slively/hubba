/*
 Creates ServiceAdapter classes that inherit from Service.
 The extra functionality revolves around the configuration items which are read in from a file.
 */

var assert = require('assert-plus'),
    util = require('util'),
    rService = require('./../service/service.js').Service,
    validInputTypes = ['text','select','selectMultiple','radio','checkbox','password','number','textarea'],
    rDefaultHTTPResponder = function(req,res){res.send(404);};

function ServiceAdapterFactory(opts, mocks){
    var opts = opts || {},
        mocks = mocks || {},
        ServiceAdapter,
        Service = mocks.Service || rService,
        defaultHTTPResponder = mocks.defaultHTTPResponder || rDefaultHTTPResponder,
        filePath = opts.path;

    assert.string(filePath,'ServiceAdapter file path');
    this.filePath = filePath;

    try{
        ServiceAdapter = require(filePath).Adapter;
    } catch(e){
        throw new Error('Failed to call require on \'' + filePath);// + '\': ' + e.stack;
    }

    assert.object(ServiceAdapter,'ServiceAdapter ' + this.filePath + ' does not export ServiceAdapter');
    assert.string(ServiceAdapter.name,'ServiceAdapter ' + this.filePath + ' name');
    this.name = ServiceAdapter.name;
    this.label = ServiceAdapter.label || this.name;

    assert.optionalFunc(ServiceAdapter.init);
    assert.optionalFunc(ServiceAdapter.validate);
    assert.optionalFunc(ServiceAdapter.update);
    assert.optionalFunc(ServiceAdapter.destroy);

    assert.optionalFunc(ServiceAdapter.GET);
    assert.optionalFunc(ServiceAdapter.POST);
    assert.optionalFunc(ServiceAdapter.PUT);
    assert.optionalFunc(ServiceAdapter.PATCH);
    assert.optionalFunc(ServiceAdapter.DELETE);


    assert.object(ServiceAdapter.configuration,'ServiceAdapter ' + this.filePath + ' configuration');

    for (var key in ServiceAdapter.configuration){

        assert.object(ServiceAdapter.configuration[key],'ServiceAdapter ' + this.filePath + ' configuration item')

        if (validInputTypes.indexOf(ServiceAdapter.configuration[key].inputType) < 0){

            throw new Error('ServiceAdapter ' + this.filePath + ' configuration item ' + key + ' has invalid inputType. Must be one of the following: ' + validInputTypes.toString());

        } else if (typeof ServiceAdapter.configuration[key].value === "undefined"){

            throw new Error('ServiceAdapter ' + this.filePath + ' configuration item ' + key + ' for service adapter ' + ServiceAdapter.name + ' does not have a default value defined, this is required.');

        } else if (['select','radio'].indexOf(ServiceAdapter.configuration[key].inputType) > -1){

            assert.ok(toString.call(ServiceAdapter.configuration[key].options) == '[object Array]','ServiceAdapter ' + this.filePath + ' configuration item ' + key + ' has invalid options. Must be an array for selects.');

            if (ServiceAdapter.configuration[key].inputType == 'select' && ServiceAdapter.configuration[key].multiple === true){

                assert.ok(toString.call(ServiceAdapter.configuration[key].value) == '[object Array]','ServiceAdapter ' + this.filePath + ' configuration item ' + key + ' has invalid value. Must be an array for multi-selects.');

                for ( var i in ServiceAdapter.configuration[key].value){
                    assert.ok(ServiceAdapter.configuration[key].options.indexOf(ServiceAdapter.configuration[key].value[i]) > -1,'ServiceAdapter ' + this.filePath + ' configuration item ' + key + ' has invalid value. It must be in the options array.')
                }

            } else {
                assert.ok(ServiceAdapter.configuration[key].options.indexOf(ServiceAdapter.configuration[key].value) > -1,'ServiceAdapter ' + this.filePath + ' configuration item ' + key + ' has invalid value. It must be in the options array.')
            }
        } else if (ServiceAdapter.configuration[key].inputType == 'checkbox'){
            assert.bool(ServiceAdapter.configuration[key].value,'ServiceAdapter ' + this.filePath + ' configuration item ' + key + ' has invalid value. Must be an boolean for checkboxes.');
        }
    }

    this.wildcardRoute = false;
    if (ServiceAdapter.wildcardRoute === true){
        this.wildcardRoute = true;
    }

    this.configuration = ServiceAdapter.configuration;
    this.configurationKeys = Object.keys(this.configuration);

    var thisFactory = this,
        ServiceAdapterFunction = function(cfg){

            Service.call(this,cfg);
            var self = this;

            this.ServiceAdapterFactory = thisFactory.toJSON();
            this.type = this.ServiceAdapterFactory.name;
            this.typeLabel = this.ServiceAdapterFactory.label;
            this.configuration = {};
            this.configurationKeys = this.ServiceAdapterFactory.configurationKeys;
            this.data = {};

            Object.keys(this.ServiceAdapterFactory.configuration).forEach(function(key){
                self.configuration[key] = self.ServiceAdapterFactory.configuration[key].value;
            });

            this.validateConfiguration(cfg);
            this.updateConfiguration(cfg);

            this.on('validate',this.validateConfiguration);
            this.on('validate',function(){
                if (ServiceAdapter.validate){
                    ServiceAdapter.validate(self.toJSON({internal:true}));
                }
            });
            this.on('update',this.updateConfiguration);
            this.on('update',function(){
                if (ServiceAdapter.update){
                    ServiceAdapter.update(self.toJSON({internal:true}));
                }
            });


            if (this.ServiceAdapterFactory.wildcardRoute){
                this.path = updateWildcardRoute(this.path);
                // this should happen before any other update event listeners
                this.on('update',function(){
                    this.path = updateWildcardRoute(this.path);
                });
            }

            this.on('destroy',function(){
                if (ServiceAdapter.destroy){
                    ServiceAdapter.destroy(self.toJSON({internal:true}));
                }
            });

            this.http = {
                GET: defaultHTTPResponder,
                POST: defaultHTTPResponder,
                PUT: defaultHTTPResponder,
                PATCH: defaultHTTPResponder,
                DELETE: defaultHTTPResponder
            };

            if (ServiceAdapter.GET){
                this.http.GET = function(req,res,next,iternalClient){
                    if (self.requiresAuthentication && req.isAuthenticated() !== true){
                        next(req.accessError);
                        return;
                    }
                    ServiceAdapter.GET(req,res,next,self.toJSON({internal:true}),iternalClient);
                }
            }

            if (ServiceAdapter.POST){
                this.http.POST = function(req,res,next,iternalClient){
                    if (self.requiresAuthentication && req.isAuthenticated() !== true){
                        next(req.accessError);
                        return;
                    }
                    ServiceAdapter.POST(req,res,next,self.toJSON({internal:true}),iternalClient);
                }
            }

            if (ServiceAdapter.PUT){
                this.http.PUT = function(req,res,next,iternalClient){
                    if (self.requiresAuthentication && req.isAuthenticated() !== true){
                        next(req.accessError);
                        return;
                    }
                    ServiceAdapter.PUT(req,res,next,self.toJSON({internal:true}),iternalClient);
                }
            }

            if (ServiceAdapter.PATCH){
                this.http.PATCH = function(req,res,next,iternalClient){
                    if (self.requiresAuthentication && req.isAuthenticated() !== true){
                        next(req.accessError);
                        return;
                    }
                    ServiceAdapter.PATCH(req,res,next,self.toJSON({internal:true}),iternalClient);
                }
            }

            if (ServiceAdapter.DELETE){
                this.http.DELETE = function(req,res,next,iternalClient){
                    if (self.requiresAuthentication && req.isAuthenticated() !== true){
                        next(req.accessError);
                        return;
                    }
                    ServiceAdapter.DELETE(req,res,next,self.toJSON({internal:true}),iternalClient);
                }
            }

            if (ServiceAdapter.init){
                try {
                    ServiceAdapter.init(self.toJSON({internal:true}));
                }
                catch(e){
                    console.trace('Service id: '+this.id,'with type',"'"+this.typeLabel+"'",'threw an error on init:',e);
                }
            }
        };

    util.inherits(ServiceAdapterFunction, Service);

    ServiceAdapterFunction.prototype.validateConfiguration = ServiceAdapterValidateConfiguration;
    ServiceAdapterFunction.prototype.updateConfiguration = ServiceAdapterUpdateConfiguration;
    ServiceAdapterFunction.prototype.toJSON = ServiceAdapterToJSON;

    this.createService = function createService(opt){
        return new ServiceAdapterFunction(opt);
    };

    return this;
}

ServiceAdapterFactory.prototype.toJSON = function() {
    return {
        name: this.name,
        label: this.label,
        filePath: this.filePath,
        configuration: this.configuration,
        configurationKeys: this.configurationKeys,
        wildcardRoute: this.wildcardRoute
    };
};

function ServiceAdapterValidateConfiguration(update){
    var r = update || {},
        cfg = r.configuration,
        errRequiredItems = [];

    assert.optionalObject(cfg, 'Service configuration');

    if (cfg){
        for ( var key in cfg ){
            // only add configuration items defined in the service adapter
            if (typeof this.ServiceAdapterFactory.configuration[key] == 'undefined'){
                throw new Error("This service adapter does not have a configuration item called " + key +".");

                // make sure they have the same type
                //	TODO, check more specifically for types like email, number ranges, colors, etc...
            } else if ( Object.prototype.toString.call(this.ServiceAdapterFactory.configuration[key].value) != Object.prototype.toString.call(cfg[key]) ){
                throw new Error(key + " must be of type " + Object.prototype.toString.call(this.ServiceAdapterFactory.configuration[key].value) + ", instead is of type " + Object.prototype.toString.call(cfg[key]) + ".");

            } else if (Array.isArray(cfg[key])){
                for ( var i in cfg[key]){
                    assert.ok(this.ServiceAdapterFactory.configuration[key].options.indexOf(cfg[key][i]) > -1,'Configuration item ' + key + ' has an invalid value. These are the valid options: ' + this.ServiceAdapterFactory.configuration[key].options.toString());
                }
            }

            if ( this.ServiceAdapterFactory.configuration[key].required === true &&
                this.ServiceAdapterFactory.configuration[key].inputType !== 'number' &&
                cfg[key].length === 0 ) {
                throw new Error(key + ' is required.');
            }
        }
    }

    for ( var key in this.ServiceAdapterFactory.configuration ) {
        if ( this.ServiceAdapterFactory.configuration[key].required === true &&
            this.ServiceAdapterFactory.configuration[key].inputType !== 'number' &&
            this.configuration[key].length === 0 &&
            (cfg === undefined || cfg[key] === undefined || cfg[key].length === 0) ) {
            errRequiredItems.push(key);
        }
    }

    if (errRequiredItems.length){
        throw new Error('The following item(s) are required: ' + errRequiredItems.join());
    }
}

function ServiceAdapterUpdateConfiguration(updates){
    var r = updates || {},
        cfg = r.configuration;

    for ( var key in cfg ){
        this.configuration[key] = cfg[key];
    }
}

function ServiceAdapterToJSON(opts){
    var o = opts || {},
        j = {
            id: this.id,
            version: this.version,
            path:this.path,
            seq:this.seq,
            type: this.type,
            typeLabel: this.typeLabel,
            configuration: {},
            configurationKeys: this.configurationKeys,
            requiresAuthentication: this.requiresAuthentication
        };

    if (o.internal === true){
        j.data = this.data;
        j.http = this.http;
    }

    for ( var key in this.configuration ){
        // when a web service calls toJSON on a service we want to make sure we don't expose passwords.
        if (this.ServiceAdapterFactory.configuration[key].inputType === 'password' && o.internal !== true){
            j.configuration[key] = '';
        } else {
            j.configuration[key] = this.configuration[key];
        }
    }

    /*if (o.includeChildren === true){
        j.children = {};
        for ( var i in this.children ){
            j.children[i] = this.children[i].toJSON({includeChildren:true});
        }
    }*/

    return j;
}

function updateWildcardRoute(path){
    return (path.substring(path.length-2,path.length) === '/*') ? path : path+'/*';
}

exports.ServiceAdapterFactory = ServiceAdapterFactory;