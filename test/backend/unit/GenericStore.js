var assert = require('assert-plus'),
    GenericStore = require('../../../lib/genericStore').GenericStore,
    dummyAdapter = {
        connected:function(){return this._type;},
        find:function(){},
        findAll:function(){},
        findVersion:function(){},
        add:function(){},
        replace:function(){},
        remove:function(){}
    };

describe('GenericStore', function(){

    it('should require a storage type string.',function(){
        assert.throws(function(){
            new GenericStore();
        },/Storage type/);
    });

    it('should require a valid storage type string.',function(){
        assert.throws(function(){
            new GenericStore({type:'test'});
        },/Storage type of /);
    });

    it('should require a db object.',function(){
        assert.throws(function(){
            new GenericStore({type:'file'});
        },/db/);
    });

    it('should require an adapters object.',function(){
        assert.throws(function(){
            new GenericStore({type:'file',db:{}});
        },/adapters/);
    });

    it('should only allow the correct adapters.',function(){
        assert.throws(function(){
            new GenericStore({type:'file',db:{},adapters:{bad:1}});
        },/Invalid adapter type: bad/);
    });

    it('adapters must be objects.',function(){
        assert.throws(function(){
            new GenericStore({type:'file',db:{},adapters:{file:1}});
        },/Adapters must be objects/);
    });

    it('adapters must contain all of the correct functions.',function(){
        assert.throws(function(){
            new GenericStore({type:'file',db:{},adapters:{file:{}}});
        },/Invalid adapter type functions for adapter file, all of the following and only the following must be defined/);
    });

    it('adapter functions must be functions.',function(){
        assert.throws(function(){
            new GenericStore({type:'file',db:{},adapters:{file:{connected:123}}});
        },/Adapters functions must be functions/);
    });

    it('must contain all of the required adapter types.',function(){
        assert.throws(function(){
            new GenericStore({
                type:'file',
                db:{},
                adapters:{
                    file: dummyAdapter
            }});
        },/Invalid adapter types, all of the following and only the following must be defined/);
    });

    it('should be created successfully.',function(){
        new GenericStore({
            type:'file',
            db:{},
            adapters:{
                file: dummyAdapter,
                memory: dummyAdapter,
                redis: dummyAdapter
            }
        });
    });

    it('should be using the file adapter.',function(){
        var fileStore = new GenericStore({
            type:'file',
            db:{},
            adapters:{
                file: dummyAdapter,
                memory: dummyAdapter,
                redis: dummyAdapter
            }
        });

        assert.equal('file',fileStore.connected());
    });

    it('should be using the memory adapter.',function(){
        var memoryStore = new GenericStore({
            type:'memory',
            db:{},
            adapters:{
                file: dummyAdapter,
                memory: dummyAdapter,
                redis: dummyAdapter
            }
        });

        assert.equal('memory',memoryStore.connected());
    });
    it('should be using the redis adapter.',function(){
        var redisStore = new GenericStore({
            type:'redis',
            db:{},
            adapters:{
                file: dummyAdapter,
                memory: dummyAdapter,
                redis: dummyAdapter
            }
        });

        assert.equal('redis',redisStore.connected());
    });

});