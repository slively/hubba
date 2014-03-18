var assert = require('assert-plus'),
    HubbaStore = require('../../../lib//hubbaStore').HubbaStore;

describe('HubbaStore', function(){

    it('should instantiate successfully for file store.',function(){
        new HubbaStore({type:'file'});
    });

    it('should instantiate successfully for redis store.',function(){
        new HubbaStore({type:'redis'});
    });

    it('should instantiate successfully for memory store.',function(){
        new HubbaStore({type:'memory'});
    });

});