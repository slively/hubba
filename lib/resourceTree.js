var assert = require('assert-plus'),
    rResourceTypesLoader = require('./resourceTypesLoader').ResourceTypesLoader,
    rResourceStore = require('./resourceStore').ResourceStore,
    util = require("util"),
    events = require("events");

/*
    maintains tree structure of resources, and consistency with storage mechanism (file/db/memory)
    exposes functions to find, add, update, and remove resources
    proxies all events from each resource
    fires 'update:path' event with whenever the path of a resource successfully changes.
    fires 'remove:path' event whenever a resource is successfully removed.

    PRIVATE:
        root (area Resource)
        store (ResourceStore)
        resources (hashmap of id:resource)

    PUBLIC:
        constructor options
            resourceTypesPath - path to resourceTypes folder
            store - options of resourceStore to create

        getTypes // returns JSON representation of all available ResourceTypes
        getRoot() // returns JSON representation of the root resource
        find(id, includeChildren) // returns JSON representation of resource or throws an error
        add(body) // returns JSON representation of resource or throws an error
        update(id,body) // returns JSON representation of resource or throws and error
        remove(id) // returns true or throws an error
 */
function ResourceTree(opts,mocks){

    events.EventEmitter.call(this);

    var opts = opts || {},
        mocks = mocks || {},
        path = opts.resourceTypesPath,
        store = opts.store || {type:'file'},
        ResourceTypesLoader = mocks.ResourceTypesLoader || rResourceTypesLoader,
        ResourceStore = mocks.ResourceStore || rResourceStore,
        resourceFactories = new ResourceTypesLoader({path:path}),
        store = new ResourceStore(store),
        resources = {},
        resourcesParentIDHash = {},
        initializing = true,
        self = this,
        root = null,
        fQueue = [];

    this.getTypes = function getTypes(cb){
        var t = [];

        try {
            for (var key in resourceFactories){
                t.push(resourceFactories[key].toJSON());
            }
        } catch(e){
            cb(e);
        }

        cb(undefined,t);
        return this;
    };

    this.getRoot = function(cb){
        if (initializing){
            fQueue.push({name:'getRoot',args:[cb]});
        } else {
            getRoot(cb);
        }
        return this;
    };

    function getRoot(cb){
        if (typeof cb === 'function'){
            cb(undefined,root.toJSON());
        }
    };

    this.find = function(id,cb){
        if (initializing){
            fQueue.push({name:'find',args:[id,cb]});
        } else {
            find(id,cb);
        }

        return this;
    };

    function find(id,cb){
        if (resources[id]){
            cb(undefined,resources[id].toJSON());
        } else {
            cb(new Error('Resource could not be found with id: ' + id));
        }
        return this;
    };

    this.findAll = function(cb){
        if (initializing){
            fQueue.push({name:'findAll',args:[cb]});
        } else {
            findAll(cb);
        }
        return this;
    };

    function findAll(cb){
        var r = [];

        for (var key in resources){
            r.push(resources[key].toJSON());
        }

        cb(undefined,r);

        return this;
    };

    this.getTree = function(cb){
        if (initializing){
            fQueue.push({name:'getTree',args:[cb]});
        } else {
            getTree(cb);
        }
        return this;
    };

    function getTree(opts,cb){
        var r = {},
            options = opts,
            callBack = cb;

        if(typeof options == 'function'){
            callBack = options;
            options = {};
        }

        options.includeChildren = true;

        try {
            r = root.toJSON({includeChildren:true});
        } catch(e){
            cb(e);
            return;
        }

        callBack(undefined,r);

        return this;
    };

    this.add = function(resource,cb){
        if (initializing){
            fQueue.push({name:'add',args:[resource,cb]});
        } else {
            add(resource,cb);
        }
        return this;
    };

    function add(resource,cb){
        var temp;

        if (resource.isRoot){
            if (root != null ){
                cb(new Error('Cannot add another root resource, one already exists.'));
                return;
            }
        } else if (typeof resourceFactories[resource.type] === 'undefined'){
            cb(new Error('Resource type ' + resource.type + ' is invalid.'));
            return;
        } else {
            if (resource.parentId === undefined){
                cb(new Error('A non-root resource must define a parentId.'));
                return;
            } else if (resources[resource.parentId] === undefined){
                cb(new Error('Parent resource with id ' + resource.parentId + 'does not exist.'));
                return;
            }

            resource.parent = resources[resource.parentId];

        }

        try {
            temp = resourceFactories[resource.type].createResource(resource);
        } catch(e){
            // rollback change to parent children object
            // This should be done by the resource / resource type and a refactor will need to be done
            delete resource.parent.children[resource.name];
            cb(e);
            return;
        }

        store.add(resource,function(err,ID){
            if(err)throw err;
            temp.id = ID;

            setupResource(temp);

            cb(undefined,resources[temp.id].toJSON());
        });

        return this;
    };

    this.update = function(id,resource,cb){
        if (initializing){
            fQueue.push({name:'update',args:[id,resource,cb]});
        } else {
            update(id,resource,cb);
        }
        return this;
    };

    function update(id,resource,cb){
        if (resources[id]){
            try {
                // if the resource type is changing we attempt to create a new resource
                //  with the same configuration then replace the old resource before updating.
                if (resource.type && resource.type != resources[id].type){
                    var old = resources[id], newJSON, newResource;

                    if(resourceFactories[resource.type]){

                        newJSON = {
                            id: old.id,
                            name: resource.name || old.name,
                            parentId: old.parentId,
                            parent: old.parent,
                            type: resource.type,
                            configuration: resource.configuration || {}
                        };

                        old.destroy();

                        newResource = resourceFactories[newJSON.type].createResource(newJSON);
                        setupResource(newResource);

                    } else {
                        cb(new Error('Resource type ' + resource.type + ' does not exist.'));
                    }

                } else {
                    resources[id].update(resource);
                }

                store.replace(resources[id],function(err,changes){
                    cb(err,resources[id].toJSON());
                });

            } catch(e){
                cb(e);
            }
        } else {
            cb(new Error('Resource could not be found with id: ' + id));
        }
        return this;
    };

    this.remove = function(id,cb){
        if (initializing){
            fQueue.push({name:'remove',args:[id,cb]});
        } else {
            remove(id,cb);
        }
        return this;
    };

    function remove(id,cb){
        var path;
        if (resources[id]){
            try {
                path = resources[id].path;
                resources[id].destroy();
            } catch(e){
                cb(e);
                return;
            }

            delete resources[id];

            store.remove(id,function(err,changes){
                self.emit('remove:path',{id:id,path:path});
                cb(err,changes);
            });

        } else {
            cb(new Error('Resource could not be found with id: ' + id));
        }
        return this;
    };



    this.destroy = function destroy(){
        store.destroyStore();
        return this;
    };

    this.getRoutes = function(cb){
        if (initializing){
            fQueue.push({name:'getRoutes',args:[cb]});
        } else {
            getRoutes(cb);
        }
        return this;
    };

    function getRoutes(cb){
        var r = [];

        for (var key in resources){
            r.push({
                id: resources[key].id,
                path: resources[key].path,
                http: resources[key].http
            });
        }

        cb(undefined,r);

        return this;
    };

    /*
        Initialize the tree structure from the data store.
        The Resources are stored in a basic table, so we must
        translate that into a tree.
     */
    function traverseAndInstantiate(parentId){

        if (resourcesParentIDHash[parentId]){
            resourcesParentIDHash[parentId].forEach(function(r){

                if (parentId !== undefined){
                    r.parent = resources[parentId];
                }

                try {
                    var temp = resourceFactories[r.type].createResource(r);
                    setupResource(temp);
                } catch(e){
                    console.log('Could not create resource:', r.name, '(id:', r.id, ')');
                    console.log('Because of error:',e);
                }

                if (parentId === undefined){
                    root = resources[r.id];
                }
                traverseAndInstantiate(r.id);
            });
        }
    };

    function setupResource(r){
        resources[r.id] = r;

        // resource saved successfully, emit an update:path event to register the routes
        //  with the server.
        self.emit('update:path',{
            id:r.id,
            path:resources[r.id].path,
            http:resources[r.id].http
        });

        // whenever the path changes in the future notify the server.
        resources[r.id].on('update:path',function(){
            self.emit('update:path',{
                id: resources[r.id].id,
                path:resources[r.id].path,
                http:resources[r.id].http
            });
        });

        if (r.isRoot){
            root = resources[r.id];
        }
    };


    store.findAll(function(err,results){

        if(err)throw err;

        if (results.length === 0){
            // no resources found, create a new root
            add({name:'api',isRoot:true,type:'area'},function(err,result){
                if (err) throw err;
                initializing = false;
                for (var i in fQueue){
                    self[fQueue[i].name].apply(this,fQueue[i].args);
                }
            });
        } else {
            // map each of the resources to a hash of parentIds to lists of resources (children).
            results.forEach(function(r){
                if (typeof resourcesParentIDHash[r.parentId] === 'undefined'){
                    resourcesParentIDHash[r.parentId] = [];
                }
                resourcesParentIDHash[r.parentId].push(r);
            });

            traverseAndInstantiate();
            initializing = false;
            for (var i in fQueue){
                self[fQueue[i].name].apply(this,fQueue[i].args);

            }
        }

    });

};

util.inherits(ResourceTree, events.EventEmitter);

exports.ResourceTree = ResourceTree;