"use strict";
var ResourceType = require('./resource_type').ResourceType
var idPool = 1;
var ResourcesStore = [];

/*
cache the config and register the routes.
each resource owns its own route handler
set the routes as a resource is created or updated.
*/
function Resource(opts){
	var o = opts || {};

	if (typeof o.name != 'string' || o.name.length == 0){
		throw 'A Resource must have a name.'
	} else if (typeof o.type != 'string' && o.type.length == 0){
		throw 'Resource type must be defined.';
	} else if (o.isRoot !== true){
		findById(o.parentId);
	}
	
	this.id = idPool++;
	this.parentId = o.parentId || undefined;
	this.name = o.name;
	this.children = o.children || {};
	this.verbs = o.verbs || [];
	this.ResourceType = new ResourceType(o.type);
	this.user_defined_config = o.user_defined_config || {};
	this.tests = o.tests || [];
	this.ResourceType.RESOURCE_CREATE(this);
	ResourcesStore.push(this);
};

Resource.prototype.update = function(opts){
	if (opts.name && opts.name != this.name){
		var p = findById(this.parentId);
		if (p.children[opts.name] != undefined){
			throw 'There is already a resource with the same parent and the same name.';
		}

		p.children[opts.name] = this;
		delete p.children[this.name];
		this.name = opts.name;
	}

	if (opts.type){
		if (opts.type.name && this.ResourceType.name != opts.type.name){
			this.ResourceType = new ResourceType(opts.type.name);
		} else if (Object.keys(this.ResourceType.config).length){
			opts.type.config = opts.type.config || {};
			
			for ( var key in this.ResourceType.config ){
				if (Object.prototype.toString.call(opts.type.config[key]) != "[object Object]" || typeof opts.type.config[key].value == 'undefined'){
					opts.type.config[key] = {
						value: this.ResourceType.config[key].value
					}
				} else if (typeof this.ResourceType.config[key].value != typeof opts.type.config[key].value){
					throw key + ' must be of type ' + typeof this.ResourceType.config[key].value;
					
				} else if (this.ResourceType.config[key].value != opts.type.config[key].value){
					this.ResourceType.config[key].value = opts.type.config[key].value;
				}
			}
		}
	}
	
	this.verbs = opts.verbs || this.verbs;
	this.url = opts.url || this.url;
	this.ResourceType.RESOURCE_UPDATE(this);
	return this;
};

Resource.prototype.del = function(){
	if (typeof this.parentId === undefined){
		throw 'Cannot delete the root resource.'
	}
	this.ResourceType.RESOURCE_DELETE(this);
	findById(this.parentId).removeChild(this.name);
}

Resource.prototype.addChild = function(opts){
	var o = opts || {};
	
	if (this.children[o.name] != undefined){
		throw 'There is already a resource with the same parent and the same name.';
	}
	this.children[o.name] = new Resource(o);
	return this.children[o.name];
};

Resource.prototype.removeChild = function(name){
	if (this.children[name])
		delete this.children[name];
		
	return this;
};

Resource.prototype.toJson = function(opts){
	var opts = opts || {};
	
	var o = {
		id: this.id,
		name: this.name,
		type: this.ResourceType.toJson(),
		verbs: this.verbs,
		user_defined_config: this.user_defined_config,
		parentId: this.parentId
	};
	
	if (opts.includeChildren === true){
		o.children = {};
		for ( var i in this.children ){
			o.children[i] = this.children[i].toJson({includeChildren:true});
		}
	}
	
	return o;
};

Resource.prototype.resolve = function(req, res){
	this.ResourceType[req.method](this,req,res) ;
};

var findById = function(id){
	for ( var i in ResourcesStore){
		if (ResourcesStore[i].id == id)
			return ResourcesStore[i];
	}
	
	throw 'Resource ' + id + ' not found.'
};

exports.findById = findById;

exports.generateResources = function(configLocation){
	require('./resource_type').refreshResourceTypes(configLocation);
	
	if (configLocation){
		console.log('TODO: read from location.');
	} else {
		return new Resource({name: 'api', type: 'area', isRoot: true});
	}
};