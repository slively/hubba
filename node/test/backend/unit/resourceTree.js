var assert = require('assert-plus'),
    ResourceTree = require('../../../lib/ResourceTree').ResourceTree,
    mockResourceValidator = function(){return true;},
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
        this.id = id || 1;
        this.isRoot = true;
        this.type = 'area';
        this.update = function(){return this;};
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
        this.add = function(o,cb){cb(undefined,new mockResourceType(++ids));};
        this.replace = function(o,cb){cb(undefined,new mockResourceType());};
        this.remove = function(id,cb){cb(undefined);};
    },
    mockResourceTypesLoader = function(){return {area:new mockResourceTypeFactory()}},
    tree;

describe('ResourceTree', function(){

    it('should instantiate and create a new ResourceTypesLoader, ResourceStore, and root Resource.',function(done){
        tree = new ResourceTree({path:'dummy',store:'memory'},{
            ResourceValidator: mockResourceValidator,
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
        assert.ok(tree.getRoot().isRoot);
        done();
    });

    it ('should allow the retrieving of a resource JSON representation by id.', function(done){
        tree.find(1,function(err,resource){
            assert.ifError(err);
            assert.equal(1,resource.id);
            done();
        });
    });

    it ('should allow the adding of a new resource.', function(done){
        tree.add({},function(err,resource){
            assert.ifError(err);
            assert.equal(1,resource.id);
            done();
        });
    });

    it ('should allow the updating of resources by id.', function(done){
        tree.update(1,{},function(err,resource){
            assert.ifError(err);
            assert.equal(1,resource.id);
            done();
        });
    });

    it ('should allow the deleting of resources by id.', function(done){
        tree.remove(1,function(err){
            assert.ifError(err);
            done();
        });
    });

});