"use strict";

var util = require('util');

var registeredResourceTypes = {};
var storedResourceTypes = [];

var defaults = {
	name: '',
	label: '',
	configuration: {},
	wildcardChildRoute: false,
	RESOURCE_CREATE: function(resource){},
	RESOURCE_UPDATE: function(resource){},
	RESOURCE_DELETE: function(resource){},
	GET: function(req,res){res.send(405);},
	POST: function(resource,req,res){res.send(405);},
	PUT: function(resource,req,res){res.send(405);},
	PATCH: function(resource,req,res){res.send(405);},
	DELETE: function(resource,req,res){res.send(405);}
};


var registerResourceType = function (type, cfg){
	if (!type || typeof type != 'string'){
		throw 'ResourceType must have a type (string).'
	} else if (registeredResourceTypes[type]){
		throw 'ResourceType of type ' + type + ' already exists.'
	}
	
	cfg.configuration = cfg.configuration || {};
	
	for (var key in cfg.configuration){
		if (typeof cfg.configuration[key].value === "undefined"){
			throw "Configuration item " + key + " for resource " + type + " does not have a default value defined, this is required."
		}
	}
	
	var t = function(type){
		for ( var key in defaults ){
			this[key] = cfg[key] || defaults[key];
		}
	};
	
	t.prototype.toJson = function(){
		return {
			name: this.name,
			label: this.label,
			configuration: this.configuration,
			wildcardChildRoute: this.wildcardChildRoute
		};
	};
	
	registeredResourceTypes[type] = t;
	storedResourceTypes.push({type: type, label: cfg.label, configuration: cfg.configuration});
	return t;
};

// if options are passed in we register a new resource type
//	otherwise we call the contrusctor the of the type passed in.
function ResourceType(type, options){
	
	// if options are passed in we are creating a new resource type
	if (typeof options == 'object'){
		return registerResourceType(type, options);
		
	// else we are returning an already created resource type if it exists
	} else { 
		
		if (typeof registeredResourceTypes[type] == 'undefined')
			throw 'Resource Type "' +type+ '" is not defined!';
		else {
			return new registeredResourceTypes[type](options);
		}
		
	}
};

exports.ResourceType = ResourceType;


exports.refreshResourceTypes = function(){
	require("fs").readdirSync(__dirname+"/ResourceTypes").forEach(function(file) {
		try {
			var rt = require(__dirname+"/ResourceTypes/" + file).ResourceType;
			if (rt && rt.name){
				new ResourceType(rt.name, rt);
			} else {
				console.warn(file + " did not define a ResourceType name.");
			}
		} catch (e){
			console.log('ResourceType File ' + file + ' produced an error when importing: ');
			console.log(e);
		}
	});
}

exports.getResourceTypes = function(){
	return storedResourceTypes;
}

