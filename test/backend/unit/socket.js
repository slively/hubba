var assert = require('assert-plus'),
    Socket = require('../../../lib/socket/socket').Socket;

describe('Socket', function(){

    it('should require a name.',function(){
        assert.throws(function(){
            new Socket();
        },/Socket name/);
    });

    it('should have a default method.',function(){
        var s = new Socket({name:'test'});
        assert.string(s.methods.default);
    });

    it('should have instantiate with an id.',function(){
        var s = new Socket({name:'test',id:1});
        assert.equal(1,s.id);
    });

    it('should not update the id after instantiation.',function(){
        var s = new Socket({name:'test',id:1});
        s.update({name:'test',id:2});
        assert.equal(1,s.id);
    });

    it('should require methods to be an object.',function(){
        assert.throws(function(){
            new Socket({name:'test',methods:1});
        },/Socket methods/);
    });


    it('should require defined methods to be strings.',function(){
        assert.throws(function(){
            new Socket({name:'test',methods:{test:1}});
        },/Socket method test/);
    });

    it('should instantiate with defined methods', function(){
        var s = new Socket({name:'test',id:1,methods:{
            'default':'test1',
            'test':'test2'
        }});

        assert.equal(s.methods.default,'test1');
        assert.equal(s.methods.test,'test2');
    });

});