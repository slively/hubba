"use strict";

var ResourceType = require('./resource_type').ResourceType,
	idPool = 1,
	ResourcesStore = [],
	assert = require('assert-plus'),
	rootResource,
	Server;

/*
cache the configuration and register the routes.
each resource owns its own route handler
set the routes as a resource is created or updated.
*/
function Resource(opts){
	var o = opts || {};
	
	assert.string(o.name, 'Resource name');
	assert.string(o.type, 'Resource type');
	
	// TODO check for valid URL names.
	if (o.name.length == 0){
		throw 'A Resource must have a name of length > 0.'
	} else if (o.type.length == 0){
		throw 'A  Resource must have a type of length > 0.';
	} else if (o.isRoot !== true){
		try{
			findById(o.parentId);
		} catch(e) {
			throw "Could not find parentId " + o.parentId;
		}
	} else if (opts.versions){
		assert.array(opts.versions,'Resource versions');
	}
	
	this.id = ++idPool;
	this.parentId = o.parentId || undefined;
	this.name = o.name;
	this.versions = ['1.0.0'] || opts.versions;
	this.children = o.children || {};
	this.type = o.type;
	this.ResourceType = new ResourceType(o.type);
	this.tests = o.tests || [];
	this.ResourceType.RESOURCE_CREATE.call(this,this);
	this.updatePath();
	ResourcesStore.push(this);
};

Resource.prototype.updatePath = function(opts){
	var opts = opts || {}, p = "", r = this;
	
	while (r.parentId){
		p = "/" + r.name + p;
		r = findById(r.parentId);
	}
	
	// add root resource name (it does not have a parentId)
	this.path = "/" + r.name + p;
	
	if (this.ResourceType.wildcardChildRoute === true){
		this.path += "/*";
	}
	
	// update children with new path
	for ( var key in this.children ){
		this.children[key].updatePath();
	}

	this.deleteServerRoute();
	this.updateSeverRoute(opts);
};

Resource.prototype.deleteServerRoute = function(){
	if (Server.routes['get'+this.id]){
		Server.rm('get'+this.id);
		Server.rm('post'+this.id);
		Server.rm('put'+this.id);
		Server.rm('patch'+this.id);
		Server.rm('del'+this.id);
	}
}

Resource.prototype.updateSeverRoute = function(opts){
	var opts = opts || {};
	
	var self = this,
		callback = function(req,res){
			self.handler.call(self,req,res);
		};

	Server.get({
		name:'get'+this.id,
		path:this.path,
		version:this.curVersion
	},callback);
	
	Server.post({
		name:'post'+this.id,
		path:this.path,
		version:this.curVersion
	},callback);
	
	Server.put({
		name:'put'+this.id,
		path:this.path,
		version:this.curVersion
	},callback);
	
	Server.patch({
		name:'patch'+this.id,
		path:this.path,
		version:this.curVersion
	},callback);
	
	Server.del({
		name:'del'+this.id,
		path:this.path,
		version:this.curVersion
	},callback);
	
};

Resource.prototype.update = function(opts){
	var opts = opts || {};
	
	// If name changes, check first for duplicate, then delete current reference in parent object and add new reference
	if (opts.name && opts.name != this.name){
		var p = findById(this.parentId);
		if (p.children[opts.name] != undefined){
			throw 'There is already a resource with the same parent and the same name.';
		}

		p.children[opts.name] = this;
		delete p.children[this.name];
		this.name = opts.name;
		this.updatePath();
	}
	
	// if a type is passed in and it's different then the current type
	if (opts.type && opts.type != this.type){	
		this.type = opts.type;
		this.ResourceType.RESOURCE_DELETE(this);
		this.ResourceType = new ResourceType(opts.type);
	}
	
	// configuration has been updated, this can still happen after updating the resource type
	//	This could cause a conflict if people don't use the API correctly and update the type but send an old configuration.
	//	Will want good documentation on this.
	if (opts.configuration){
		
		// configuration must be an object
		assert.object(opts.configuration, 'configuration');
		
		for ( var key in opts.configuration ){

			// only add configuration items defined in the resource type
			if (typeof this.ResourceType.configuration[key] == 'undefined'){
				throw "This resource type does not have a configuration item called " + key +".";
				
			// make sure they have the same type
			//	TODO, check more specifically for types like email, number ranges, colors, etc...
			} else if ( Object.prototype.toString.call(this.ResourceType.configuration[key].value) != Object.prototype.toString.call(opts.configuration[key]) ){
				throw key + " must be of type " + Object.prototype.toString.call(this.ResourceType.configuration[key].value) + ", instead is of type " + Object.prototype.toString.call(opts.configuration[key]) + ".";
				
			} else {
				this.ResourceType.configuration[key].value = opts.configuration[key];
			}
		}
	}
	
	// Call resource type update function after the configuration is all updated.
	this.ResourceType.RESOURCE_UPDATE.call(this,this);
	
	return this;
};

Resource.prototype.del = function(){
	if (typeof this.parentId === undefined){
		throw 'Cannot delete the root resource.';
	} else if (Object.keys(this.children).length > 0){
		throw 'You must delete the children of a resource, before deleting a resource.';
	}
	
	// call custom resource delete code
	this.ResourceType.RESOURCE_DELETE(this);
	
	// remove from store -- will be a file/database at some point
	for ( var i in ResourcesStore ){
		if (ResourcesStore[i].id == this.id){
			ResourcesStore.splice(i,1);
			break;
		}
	}
	this.deleteServerRoute();
	// remove reference from parent (no longer accessible now)
	findById(this.parentId).removeChild(this.name);
}

Resource.prototype.addChild = function(opts){
	assert.object(opts,"Child resource object");
	assert.string(opts.name, "Child resource name");
	
	if (this.children[opts.name]){
		throw 'There is already a resource with the same parent and the same name.';
	}
	
	opts.parentId = this.id;
	this.children[opts.name] = new Resource(opts);
	return this.children[opts.name];
};

Resource.prototype.removeChild = function(name){
	if (this.children[name])
		delete this.children[name];
		
	return this;
};

Resource.prototype.toJson = function(opts){
	var opts = opts || {};
	var configuration = {};
	for ( var key in this.ResourceType.configuration ){
		configuration[key] = this.ResourceType.configuration[key].value;
	}

	var o = {
		id: this.id,
		name: this.name,
		type: this.ResourceType.name,
		typeLabel: this.ResourceType.label,
		configuration: configuration,
		parentId: this.parentId,
		path:this.path
	};
	
	if (opts.includeChildren === true){
		o.children = {};
		for ( var i in this.children ){
			o.children[i] = this.children[i].toJson({includeChildren:true});
		}
	}
	
	return o;
};

Resource.prototype.handler = function(req, res){
	this.ResourceType[req.method].call(this,this,req,res);
};

var findById = function(id){
	for ( var i in ResourcesStore){
		if (ResourcesStore[i].id == id)
			return ResourcesStore[i];
	}
	
	throw 'Resource ' + id + ' not found.';
};

exports.findById = findById;
exports.rootResource = rootResource;

exports.generateResources = function(configLocation){
	require('./resource_type').refreshResourceTypes(configLocation);
	
	if (configLocation){
		console.log('TODO: read from location.');
	} else {
		return rootResource = new Resource({name: 'api', type: 'area', isRoot: true});
	}
};

exports.registerServer = function(s){
	Server = s;
}