"use strict";

var assert = require('assert-plus'),
    fs = require('fs'),
    ResourceTree = require('../../../lib/resourceTree').ResourceTree,
    rootPath = __dirname+'/../../../lib/ResourceTypes',
    tree,
    area,
    area_child;

describe('ResourceTree (file) 1st creation.',function(){

    var root;

    it('should instantiate successfully with a name of test.',function(done){
        tree = new ResourceTree({store:{name:'test',type:'file'}});
        done();
    });

    // should have all the default types
    it('should have all of the default types.',function(done){
        var files = fs.readdirSync(rootPath),
            types;

        tree.getTypes(function(err,result){
            types = result;

            types.forEach(function(type){
                assert.ok(files.indexOf(type.name) > -1);
            });

            done();
        });

    });

    // should be a root resource generated
    it('should have a root resource called "api".',function(done){
        tree.getRoot(function(err,r){
            assert.ifError(err);
            root = r;
            assert.object(root);
            assert.equal('api',root.name);
            assert.equal('area',root.type);
            assert.equal(undefined,root.parentId);
            done();
        });
    });

    it('should fail to add a new resource named without a parent.',function(done){
        tree.add({type:'area',name:'area',isRoot:true},function(err){
            assert.ok(err.message.indexOf('Cannot add another root resource') > -1);
            done();
        });
    });

    it('should add a new resource named "area"',function(done){
       tree.add({type:'area',name:'area',parentId:root.id},function(err,result){
           assert.ifError(err);
           assert.equal('area',result.type);
           assert.equal('area',result.name);
           assert.ok(result.id);
           area = result;
           done();
       });
    });

    it('should fail to add a new resource to the root with the same name.',function(done){
        tree.add({type:'area',name:'area',parentId:root.id},function(err){
            assert.ok(err.indexOf('already has a child') > -1);
            done();
        });
    });

    it('should change the type of "area" to redirect',function(done){
        tree.update(area.id,{type:'redirect',configuration:{url:'http://dummy.com'}},function(err,result){
            assert.ifError(err);
            assert.equal(result.type,'redirect');
            done();
        })
    });

    it('should change the type of "area" back to area',function(done){
        tree.update(area.id,{type:'area'},function(err,result){
            assert.ifError(err);
            assert.equal(result.type,'area');
            done();
        })
    })

    it('should add a new child to "area" called "area_child".',function(done){
        tree.add({type:'area',name:'area_child',parentId:area.id},function(err,result){
            assert.ifError(err);
            assert.equal('area',result.type);
            assert.equal('area_child',result.name);
            assert.ok(result.id);
            area_child = result;
            done();
        });
    });

    // test find,findall,add,update,remove
    // test destroy
});


describe('ResourceTree (file) 2nd creation.',function(){

    it('should call findAll and retrieve the 3 stored resources.',function(done){
        tree.findAll(function(err,result){
            assert.ifError(err);
            assert.equal(3,result.length);
            done();
        });
    });

    it('should call getTree and retrieve the 3 stored resources as a tree.',function(done){
        tree.getTree(function(err,result){
            assert.ifError(err);
            assert.equal(result.children.area.id,2,'area_child id');
            assert.equal(result.children.area.children.area_child.id,3,'area_child id');
            done();
        });
    });

    it('should find the "area" resource.',function(done){
       tree.find(area.id,function(err,result){
           assert.ifError(err);
           assert.equal(area.id,result.id);
           assert.equal('area',result.name);
           done();
       });
    });

    it('should remove the "area_child" resource.',function(done){
        tree.remove(area_child.id,function(err){
            assert.ifError(err);
            done();
        });
    });

    it('should fail to find the "area_child" resource.',function(done){
        tree.find(area_child.id,function(err){
            assert.ok(err.message.indexOf('Resource could not be found with id') > -1);
            done();
        })
    });

    it('should erase the data-store.',function(done){
        tree.destroy();
        fs.exists(__dirname+'/../../../lib/sqliteDB/test.db', function(exists){
            assert.ok(!exists);
            done();
        });
    });

});