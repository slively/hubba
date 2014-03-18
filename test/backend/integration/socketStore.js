var assert = require('assert-plus'),
    SocketStore = require('../../../lib/socket/socketStore').SocketStore;

describe('SocketStore', function(){

    it('should instantiate successfully for file store.',function(){
        new SocketStore({type:'file',db:{}});
    });

    it('should instantiate successfully for redis store.',function(){
        new SocketStore({type:'redis',db:{}});
    });

    it('should instantiate successfully for memory store.',function(){
        new SocketStore({type:'memory',db:{}});
    });

});