"use strict";

var assert = require('assert-plus'),
        util = require("util"),
    events = require("events"),
    nameRegEx = /([A-Za-z0-9\-\_]+)/;

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

    this.validate(opts);

    if (o.isRoot !== true){
        this.isRoot = undefined;
        this.parent = o.parent;
        this.parentId = o.parent.id;
        o.parent.children[o.name] = this;
    } else {
        this.isRoot = true;
    }

	this.id = o.id;
	this.name = o.name;
	this.children = o.children || {};
    this.path = '';
    this.childRoutes = false;

    if (o.childRoutes === true){
        this.childRoutes = true;
    }

    // only applied during initialization, after that it should be incremented by the user.
    assert.optionalNumber(o.version, 'Resource version');
    this.version = o.version || 1;

    this.updatePath();
};

util.inherits(Resource, events.EventEmitter);


Resource.prototype.update = function(opts){
	var opts = opts || {};

    this.validate(opts);

	// If name changes, check first for duplicate, then delete current reference in parent object and add new reference
	if (opts.name && opts.name != this.name) {
        if (this.parent){
            this.parent.children[opts.name] = this;
            delete this.parent.children[this.name];
        }
		this.name = opts.name;
	}

    // if parentId changes, check to make sure new parent exists, and doesn't already have a child of the same name.
    if(opts.parentId && opts.parentId != this.parentId){
        delete this.parent.children[this.name];

        this.parentId = opts.parentId;
        this.parent = opts.parent;
        this.parent.children[this.name] = this;

        this.isRoot = undefined;
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
    this.updatePath();
    this.emit('update',opts);
	return this;
};

Resource.prototype.updatePath = function(){
    var p = "", r = this, curPath = this.path.toString();

    while (r.parent){
        p = "/" + r.name + p;
        r = r.parent;
    }

    // add root resource name (it does not have a parentId)
    this.path = "/" + r.name + p;

    // TODO: have a displayPath as well?

    if (curPath != this.path){

        for(var key in this.children){
            this.children[key].updatePath();
        }

        this.emit('update:path');
    }
};

Resource.prototype.destroy = function(){
	if (Object.keys(this.children).length > 0){
		throw new Error('You must delete the children of a resource, before deleting a resource.');
	}

    if (this.parent){
        delete this.parent.children[this.name];
    }

    this.emit('destroy');
    this.removeAllListeners();
};

Resource.prototype.validate = function(opts){
    var o = opts || {};

    assert.optionalString(o.name, 'Resource name');
    assert.optionalBool(o.isRoot);
    assert.optionalObject(o.parent);

    if (!this.name && (!o.name || o.name.length == 0)){
        throw new Error('Resource must have a name of length > 0.');
    } else if (nameRegEx.test(o.name) === false){
        throw new Error('Resource name can only contain letters, numbers, underscores, and hyphens.');
    } else if(this.isRoot !== true && this.parent === undefined && o.isRoot !== true && o.parent === undefined){
        throw new Error('Resource must either be a root or have a parent.');
    } else if( ((this.isRoot || o.isRoot === true) && o.parent) ||
        ((this.parent || o.parent) && o.isRoot === true) ){
        throw new Error('Resource cannot be a root and have a parent.');
    } else if (o.name != this.name && o.parent && o.parent.children[o.name]){
        throw new Error('Parent resource ' + o.parent.name + ' already has a child named ' + o.name + '.');
    }

    this.emit('validate',opts);

    return this;
};

exports.Resource = Resource;