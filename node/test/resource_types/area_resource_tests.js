var assert = require("assert");
var client = require('restify').createJsonClient({
    version: '*',
    url: 'http://127.0.0.1:8080'
});

var rootId;

describe('area resource tests', function() {
	
	it('GET /api/hubba/resources should get a 200 response', function(done) {
		client.get('/api/hubba/resources', function(err, req, res, data) {
			assert.ifError(err);
			rootId = data.id;
			done();
		});
	});
	
	// add new area resource
	it('POST /api/hubba/resources should get a 200 response for '+resourceTypes.length+' resource types.', function(done) {
	
		client.post('/api/hubba/resources', {
			parentId: rootId,
			name: type+'_resource',
			type: 'area',
			verbs: ['GET','POST','PUT','PATCH','DELETE']
		}, function(err, req, res, data) {
			assert.ifError(err);
			createdIds.push(data.id);
			
			cnt++;
			if (cnt == resourceTypes.length){
            	done();
			}
		});
		
	});
	
	// update verbs
	it('PUT /api/hubba/resources should get a 200 response for '+resourceTypes.length+' resource types.', function(done) {	
		var cnt = 0;
		createdIds.forEach(function(id){
	        client.put('/api/hubba/resources/'+id, {
				verbs : []
			}, function(err, req, res, data) {
				assert.ifError(err);
                cnt++;
				if (cnt == createdIds.length){
                	done();
				}
            });
		});
	});    
	
	// delete area resource
	it('DELETE /api/hubba/resources should get a 200 response for '+resourceTypes.length+' resource types.', function(done) {	
		var cnt = 0;
		createdIds.forEach(function(id){
            client.del('/api/hubba/resources/'+id, function(err, req, res, data) {
				assert.ifError(err);
                cnt++;
				if (cnt == createdIds.length){
                	done();
				}
            });
		});
	});
});