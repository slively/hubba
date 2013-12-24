var assert= require('assert-plus'),
    Resource = require("../../../lib/resource").Resource,
    r;

describe('Resource', function(){

    it('should require an id.',function(done){
        assert.throws(
            function() {
                new Resource();
            },
            /Resource must have an id/
        );

        done();
    });

    it('should require a name.',function(done){
        assert.throws(
            function() {
                new Resource({id:1});
            },
            /Resource name/
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
        assert.equal('test', r.name);
        done();
    });

    it('should be created successfully with a parentId of 1.',function(done){
        var t = new Resource({id:1,name:'test', parent:r});
        assert.equal(1, t.parentId);
        done();
    });

    it ('should be updated successfully and emit update event.', function(done){
        r.on('update',function(){
            assert.equal('test', r.name);
            done();
        });
        r.update({name:'test2'})
    });

    it ('should be destroyed successfully and emit the destroy event.', function(done){
        r.on('destroy',function(){
            done();
        });
        r.destroy({name:'test2'})
    });

    // TODO
    //  create resource based off it's own configuration
    //

});