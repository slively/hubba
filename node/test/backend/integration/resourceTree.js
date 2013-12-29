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

    it('should instantiate successfully with only default options.',function(done){
        tree = new ResourceTree();
        done();
    });

    // should have all the default types
    it('should have all of the default types.',function(done){
        var files = fs.readdirSync(rootPath),
            types = tree.getTypes();

        types.forEach(function(type){
            assert.ok(files.indexOf(type.name+'.js') > -1);
        });

        done();

    });

    // should be a root resource generated
    it('should have a root resource called "api".',function(done){
        tree.getRoot(function(err,r){
            assert.ifError(err);
            root = r;console.log(r);
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
        fs.exists(__dirname+'/../../../lib/sqliteDB/hubba.db', function(exists){
            assert.ok(!exists);
            done();
        });
    });

});