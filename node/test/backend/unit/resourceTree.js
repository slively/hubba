var assert = require('assert-plus'),
    events = require("events"),
    util = require("util"),
    ResourceTree = require('../../../lib/ResourceTree').ResourceTree,
    mockResourceTypeFactory = function(){

        this.toJSON = function(){
            return {
                name: 'area',
                configuration: {}
            }
        }

        this.createResource = function(){
            return new mockResourceType();
        };
    },
    mockResourceType = function(id){
        events.EventEmitter.call(this);
        this.id = id || 1;
        this.isRoot = true;
        this.type = 'area';
        var self = this;
        this.update = function(){self.emit('update:path');};
        this.destroy = function(){return this;};
        this.toJSON = function(){
            return {id:this.id,isRoot:true,type:'area'};
        }
    },
    mockResourceStore = function(){
        var ids = 6;
        this.find = function(id,cb){ cb(undefined,new mockResourceType());};
        this.findAll = function(cb){
            cb(undefined,[
                {id:1,type:'area',isRoot:true},
                {id:2,type:'area',parentId:1},
                {id:3,type:'area',parentId:1},
                {id:4,type:'area',parentId:2},
                {id:5,type:'area',parentId:3},
            ]);
        }
        this.add = function(o,cb){cb(undefined,++ids);};
        this.replace = function(o,cb){cb(undefined,new mockResourceType());};
        this.remove = function(id,cb){cb(undefined);};
    },
    mockResourceTypesLoader = function(){return {area:new mockResourceTypeFactory()}},
    tree,
    resource;

util.inherits(mockResourceType, events.EventEmitter);

describe('ResourceTree', function(){

    it('should instantiate and create a new ResourceTypesLoader, ResourceStore, and root Resource.',function(done){
        tree = new ResourceTree({resourceTypesPath:'dummy',store:'memory'},{
            ResourceStore: mockResourceStore,
            ResourceTypesLoader: mockResourceTypesLoader
        });
        done();
    });

    it ('should allow the retrieving of the resource types JSON representation.', function(done){
        var types = tree.getTypes();
        assert.arrayOfObject(types,'Mock ResourceType');
        done();
    });

    it ('should allow the retrieving of the root resource JSON representation.', function(done){
        tree.getRoot(function(err,root){
            assert.equal(undefined,root.parentId);
            done();
        });
    });

    it ('should allow the retrieving of a resource JSON representation by id.', function(done){
        tree.find(1,function(err,resource){
            assert.ifError(err);
            assert.equal(1,resource.id);
            done();
        });
    });

    it ('should allow the adding of a new resource.', function(done){
        tree.add({type:'area',parentId:1},function(err,r){
            assert.ifError(err);
            assert.equal(7,r.id);
            resource = r;
            done();
        });
    });

    it ('should allow the updating of resources by id.', function(done){
        tree.update(resource.id,{},function(err,r){
            assert.ifError(err);
            assert.equal(resource.id,r.id);
            done();
        });
    });

    it('should throw an "update:path" event whenever any resource throws the same event.',function(done){
        tree.on('update:path',function(){
            done();
        });
        tree.update(resource.id,{},function(){});
    });

    it ('should allow the deleting of resources by id and fire the "remove:path event".', function(done){
        tree.on('remove:path',function(obj){
           assert.equal(resource.id,obj.id);
        });
        tree.remove(resource.id,function(err){
            assert.ifError(err);
            done();
        });
    });

});