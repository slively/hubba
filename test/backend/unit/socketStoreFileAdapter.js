var assert = require('assert-plus'),
    adapter = require('../../../lib/socket/socketStoreFileAdapter').Adapter;

describe('socketFileStoreAdapter', function(){


    it('should have all the necessary functions.',function(done){
        assert.ok(adapter.connected,'connected function');
        assert.ok(adapter.find,'find function');
        assert.ok(adapter.findVersion,'findVersion function');
        assert.ok(adapter.findAll,'findAll function');
        assert.ok(adapter.add,'add function');
        assert.ok(adapter.replace,'replace function');
        assert.ok(adapter.remove,'remove function');mo
    });

});