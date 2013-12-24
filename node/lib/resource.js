"use strict";

var assert = require('assert-plus'),
    util = require("util"),
    events = require("events");

/*
    Simple tree node for a ResourceTree that inherits from EventEmitter.
    Fires events when initialized, updated, and destroyed.
    Core attributes for a resource exist here.
    Has basic functions for initialization, update, Destroy, addChild, and removeChild.
    Anything related to keeping the tree correct and stored in the database is in ResourceTree.js
    Every ResourceType inherits from this class.
    Anything related to the configuration and the toJSON function is in ResourceTypeFactory.js
*/

function Resource(opts){
    events.EventEmitter.call(this);

	var o = opts || {};

    if (typeof o.id === 'undefined'){
        throw 'Resource must have an id.';
    }

    ResourceValidator(opts);

    if (o.isRoot !== true){
        this.parent = o.parent;
        this.parentId = o.parent.id;
    }

	this.id = o.id;
    this.isRoot = o.isRoot;
	this.name = o.name;
	this.versions = ['1.0.0'] || o.versions;
	this.children = o.children || {};
    this.childRoutes = o.childRoutes;
    this.updatePath();
    this.emit('init');
};

util.inherits(Resource, events.EventEmitter);


Resource.prototype.update = function(opts){
	var opts = opts || {};

	// If name changes, check first for duplicate, then delete current reference in parent object and add new reference
	if (!this.isRoot && opts.name && opts.name != this.name){
		var p = this.parent;
		if (p.children[opts.name] != undefined){
			throw 'There is already a resource with the same parent and the same name.';
		}

		p.children[opts.name] = this;
		delete p.children[this.name];
		this.name = opts.name;
		//this.updatePath();
        this.emit('update:path');
	}

    // if parentId changes, check to make sure new parent exists, and doesn't already have a child of the same name.
    if(opts.parentId && opts.parentId != this.parentId){
        var p = findById(opts.parentId), op = this.parent;
        p.addChild(this);
        this.parentId = p.id;
        this.parent = p;
        delete op.children[this.name];
        this.isRoot = false;
    }

	// if a type is passed in and it's different then the current type
	/*if (opts.type && opts.type != this.type){
		this.type = opts.type;
		this.ResourceType.RESOURCE_DELETE(this);
		this.ResourceType = new ResourceType(opts.type);
	}*/

    // configuration has been updated, this can still happen after updating the resource type
    //	This could cause a conflict if people don't use the API correctly and update the type but send an old configuration.
    //	Will want good documentation on this.
    //this.updateConfiguration(opts.configuration);

	// Call resource type update function after the configuration is all updated.
	//this.ResourceType.RESOURCE_UPDATE.call(this,this);
    this.emit('update');
	return this;
};

Resource.prototype.updatePath = function(opts){
    var opts = opts || {}, p = "", r = this;

    while (r.parent){
        p = "/" + r.name + p;
        r = r.parent;
    }

    // add root resource name (it does not have a parentId)
    this.path = "/" + r.name + p;

    // TODO: have a displayPath as well?

    if (this.childRoutes === true){
        this.path+='(.*)';
    }
};

Resource.prototype.destroy = function(){
	if (Object.keys(this.children).length > 0){
		throw 'You must delete the children of a resource, before deleting a resource.';
	}
	
	// call custom resource delete code
	//
	// this.ResourceType.RESOURCE_DELETE(this);
	
	// remove from store -- will be a file/database at some point
	/*for ( var i in ResourcesStore ){
		if (ResourcesStore[i].id == this.id){
			ResourcesStore.splice(i,1);
			break;
		}
	}*/


	//this.deleteServerRoute();
	// remove reference from parent (no longer accessible now)
	//findById(this.parentId).removeChild(this.name);
    this.emit('destroy');
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


function ResourceValidator(opts){
    var o = opts || {};

    assert.string(o.name, 'Resource name');
    assert.optionalBool(o.isRoot);
    assert.optionalObject(o.parent);
    assert.optionalArrayOfString(o.versions,'Resource versions');

    // TODO check for valid URL names.
    if (o.name.length == 0){
        throw 'Resource must have a name of length > 0.';
    } else if (o.isRoot !== true){
        if (typeof o.parent === 'undefined'){
            throw 'Resource must either be a root or have a parent.';
        }
    } else if (o.isRoot === true && typeof o.parent !== 'undefined'){
        throw 'Resource cannot be a root and have a parent.';
    }

    return true;
};

exports.Resource = Resource;
exports.ResourceValidator = ResourceValidator;

















/*

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
        path: this.path,
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

*/