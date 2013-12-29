var assert= require('assert-plus'),
    Resource = require("../../../lib/resource").Resource,
    r,
    r2;

describe('Resource', function(){

    /*
    it('should require an id.',function(done){
        assert.throws(
            function() {
                new Resource();
            },
            /Resource must have an id/
        );

        done();
    });
    */

    it('should require a name.',function(done){
        assert.throws(
            function() {
                new Resource({id:1});
            },
            /Resource must have a name/
        );

        done();
    });

    it('should require a valid name.',function(done){
        assert.throws(
            function() {
                new Resource({id:1,name:'*'});
            },
            /Resource name can only contain letters/
        );

        done();
    });

    it('should require a parentId or isRoot === true.',function(done){
        assert.throws(
            function() {
                new Resource({id:1,name:'test'});
            },
            /Resource must either be a root or have a parent/
        );

        done();
    });

    it('cannot be a root and have a parentId.',function(done){
        assert.throws(
            function() {
                new Resource({id:0,name:'test',isRoot:true,parent:{}});
            },
            /Resource cannot be a root and have a parent/
        );

        done();
    });

    it ('should be created successfully as a root Resource.', function(done){
        r = new Resource({id:1,name:'test', isRoot: true});
        assert.equal(r.name, 'test');
        done();
    });

    it('should be created successfully with a parentId of 1.',function(done){
        r2 = new Resource({id:1,name:'test', parent:r});
        assert.equal(1, r2.parentId);
        assert.equal(r2.path, '/test/test');
        done();
    });

    it ('should be updated successfully and emit update:path event, should also children paths.', function(done){
        r.on('update:path',function(){
            assert.equal(r.name, 'test2');
            assert.equal(r.path, '/test2');
            assert.equal(r2.path,'/test2/test');
            done();
        });
        r.update({name:'test2'})
    });

    it ('should throw an error when trying to destroy because it has a child.', function(done){
        assert.throws(
            function(){
                r.destroy({name:'test2'})
            },
            /You must delete the children of a resource, before deleting a resource/
        );
        done();
    });


    it ('should destroy the child resource successfully.', function(done){
        r.children.test.on('destroy',function(){
            done();
        });
        r.children.test.destroy({name:'test2'})
    });

    it ('should be destroyed successfully and emit the destroy event.', function(done){
        r.on('destroy',function(){
            done();
        });
        r.destroy({name:'test2'})
    });

});