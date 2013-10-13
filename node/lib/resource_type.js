"use strict";

var util = require('util');

var registeredResourceTypes = {};
var storedResourceTypes = [];

var defaults = {
	name: '',
	label: '',
	config: {},
	RESOURCE_CREATE: function(){},
	RESOURCE_UPDATE: function(){},
	RESOURCE_DELETE: function(){},
	GET: function(req,res){res.send(405);},
	POST: function(req,res){res.send(405);},
	PUT: function(req,res){res.send(405);},
	PATCH: function(req,res){res.send(405);},
	DELETE: function(req,res){res.send(405);},
	HEAD: function(req,res){res.send(405);}
};


var registerResourceType = function (type, cfg){
	if (!type || typeof type != 'string'){
		throw 'ResourceType must have a type (string).'
	} else if (registeredResourceTypes[type]){
		throw 'ResourceType of type ' + type + ' already exists.'
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
			config: this.config
		};
	};
	
	registeredResourceTypes[type] = t;
	storedResourceTypes.push({type: type, label: cfg.label, config: cfg.config});
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
			new ResourceType(rt.name, rt);
		} catch (e){
			console.log(e);
		}
	});
}

exports.getResourceTypes = function(){
	return storedResourceTypes;
}

