var assert = require('assert-plus'),
    rResourceValidator = require('./resource').ResourceValidator,
    rResourceTypesLoader = require('./resourceTypesLoader').ResourceTypesLoader,
    rResourceStore = require('./resourceStore').ResourceStore;

/*
    maintains tree structure of resources, and consistency with storage mechanism (file/db/memory)
    exposes functions to find, add, update, and remove resources

    PRIVATE:
        root (area Resource)
        store (ResourceStore)
        resources (hashmap of id:resource)

    PUBLIC:
        constructor options
            path to resourceTypes folder
            type of resourceStore to create

        getTypes // returns JSON representation of all available ResourceTypes
        getRoot() // returns JSON representation of the root resource
        find(id, includeChildren) // returns JSON representation of resource or throws an error
        add(body) // returns JSON representation of resource or throws an error
        update(id,body) // returns JSON representation of resource or throws and error
        remove(id) // returns true or throws an error
 */
function ResourceTree(opts,mocks){
    var opts = opts || {},
        mocks = mocks || {},
        path = opts.path,
        store = opts.store || 'memory',
        ResourceValidator = mocks.ResourceValidator || rResourceValidator,
        ResourceTypesLoader = mocks.ResourceTypesLoader || rResourceTypesLoader,
        ResourceStore = mocks.ResourceStore || rResourceStore,
        resourceFactories = new ResourceTypesLoader({path:opts.path}),
        store = new ResourceStore({type:opts.store}),
        resources = {},
        resourcesParentIDHash = {},
        initializing = true,
        root;// = new resourceTypes['area']({isRoot:true,name:'api'});

    this.getTypes = function getTypes(){
        var t = [];

        for (var key in resourceFactories){
            t.push(resourceFactories[key].toJSON());
        }

        return t;
    };

    this.getRoot = function getRoot(){
        return root.toJSON();
    };

    this.find = function(id,cb){
        if (resources[id]){
            cb(undefined,resources[id].toJSON());
        } else {
            cb(new Error('Resource could not be found with id: ' + id));
        }
        return this;
    };

    this.findAll = function(cb){
        var r = [];

        resources.forEach(function(r){
            r.push(r.toJSON());
        });

        cb(undefined,r);

        return this;
    };

    this.add = function add(resource,cb){

        if(ResourceValidator(resource)){
            store.add(resource,function(err,result){
                if(err)throw err;
                resources[result.id] = resourceFactories[result.type].createResource(result);
                cb(undefined,resources[result.id].toJSON());
            });
        }

        return this;
    };

    this.update = function update(id,resource,cb){
        if (resources[id]){
            try {
                resources[id].update(resource);
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

    this.remove = function remove(id,cb){
        if (resources[id]){
            try {
                resources[id].destroy();
                delete resources[id];
                store.remove(id,function(err,changes){
                    cb(err,changes);
                });
            } catch(e){
                cb(e);
            }
        } else {
            cb(new Error('Resource could not be found with id: ' + id));
        }
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
                resources[r.id] = resourceFactories[r.type].createResource(r);
                if (parentId === undefined){
                    root = resources[r.id];
                }
                traverseAndInstantiate(r.id);
            });
        }
    };

    store.findAll(function(err,results){

        // map each of the resources to a hash of parentIds to lists of resources (children).
        results.forEach(function(r){
            if (typeof resourcesParentIDHash[r.parentId] === 'undefined'){
                resourcesParentIDHash[r.parentId] = [];
            }
            resourcesParentIDHash[r.parentId].push(r);
        });

        traverseAndInstantiate();
    });

};

exports.ResourceTree = ResourceTree;