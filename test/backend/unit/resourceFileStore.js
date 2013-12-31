var assert= require('assert-plus'),
    ResourceStore = require("../../../lib/resourceStore").ResourceStore,
    resource = {name:'test'},
    fs = require('fs'),
    rs,
    rid;

describe('ResourceStore (file)', function(){

    it('should require a type.',function(done){
        assert.throws(
            function() {
                new ResourceStore();
            }
        );

        done();
    });

    it ('should create a file store with a configured name successfully.', function(done){
        rs = new ResourceStore({type:'file', name:'woo'});

        setTimeout(function(){
            fs.exists(__dirname+'/../../../lib/sqliteDB/woo.db', function(exists){

                assert.ok(exists);
                done();
            });
        },100);
    });

    it('should delete the database file woo.db',function(done){
        rs.destroyStore();
        fs.exists('../../../lib/sqliteDB/woo.db', function(exists){
            assert.ok(!exists);
            done();
        });
    });

    it ('should create a file store with the default name successfully.', function(done){
        rs = new ResourceStore({type:'file'});

        setTimeout(function(){
            fs.exists(__dirname+'/../../../lib/sqliteDB/hubba.db', function(exists){
                assert.ok(exists);
                done();
            });
        },100);
    });

    it ('should fail to find a resource with an id of 1.', function(done){
        rs.find(1,function(err,resource){
            assert.ok(err);
            done();
        });
    });

    it ('should create a resource.', function(done){
        rs.add(resource,function(err,id){
            assert.ifError(err);
            assert.ok(id)
            resource.id = id;
            done();
        });
    });

    it ('should find the resource with the id ' + rid, function(done){
        rs.find(resource.id,function(err,found){
            assert.ifError(err);
            assert.equal(resource.id,found.id);
            assert.equal(resource.name,found.name);
            done();
        });
    });

    it ('should replace the resource with the id ' + rid, function(done){
        resource.name = "updated";

        rs.replace(resource,function(err,changes){
            assert.ifError(err);
            assert.ok(changes);

            rs.find(resource.id,function(err,found){
                assert.ifError(err);
                assert.equal(resource.id,found.id);
                assert.equal(resource.name,found.name);
                done();
            });
        });
    });

    it ('should create a second resource.', function(done){
        rs.add({name:'test2'},function(err,id){
            assert.ifError(err);
            assert.ok(id);
            done();
        });
    });

    it ('should find all stored resources.', function(done){
        rs.findAll(function(err,results){
            assert.ifError(err);
            assert.equal(2,results.length);
            assert.equal(1,results[0].id);
            assert.equal(2,results[1].id);
            done();
        });
    });

    it ('should delete the resource with the id ' + rid, function(done){
        rs.remove(resource.id,function(err,changes){
            assert.ifError(err);
            assert.ok(changes)
            done();
        });
    });

    it('should delete the database file hubba.db',function(done){
        rs.destroyStore();
        fs.exists(__dirname+'/../../../lib/sqliteDB/hubba.db', function(exists){
            assert.ok(!exists);
            done();
        });
    });
});