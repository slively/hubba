var assert= require('assert-plus'),
    ResourceStore = require("../../../lib/resourceStore").ResourceStore,
    resource = {name:'test'},
    rid;

describe('ResourceStore (memory)', function(){

    it('should require a type.',function(done){
        assert.throws(
            function() {
                new ResourceStore();
            }
        );

        done();
    });

    it ('should create a memory store successfully.', function(done){
        r = new ResourceStore({type:'memory'});
        done();
    });

    it ('should fail to find a resource with an id of 1.', function(done){
        r.find(1,function(err,resource){
            assert.ok(err);
            done();
        })
    });

    it ('should create a resource.', function(done){
        r.add(resource,function(err,id){
            assert.ifError(err);
            assert.ok(id)
            resource.id = id;
            done();
        })
    });

    it ('should find the resource with the id ' + rid, function(done){
        r.find(resource.id,function(err,found){
            assert.ifError(err);
            assert.equal(resource.id,found.id);
            assert.equal(resource.name,found.name);
            done();
        })
    });

    it ('should replace the resource with the id ' + rid, function(done){
        resource.name = "updated";

        r.replace(resource,function(err,changes){
            assert.ifError(err);
            assert.ok(changes);

            r.find(resource.id,function(err,found){
                assert.ifError(err);
                assert.equal(resource.id,found.id);
                assert.equal(resource.name,found.name);
                done();
            });
        })
    });



    it ('should delete the resource with the id ' + rid, function(done){
        r.remove(resource.id,function(err,changes){
            assert.ifError(err);
            assert.ok(changes)
            done();
        })
    });


});