var assert = require("assert");
var client = require('restify').createJsonClient({
    version: '*',
    url: 'http://127.0.0.1:8080'
});

var rootId;
var createdIds = [];
var resourceTypes = [];

describe('/api/hubba/resources', function() {
	
	it('should get all resource types', function(done) {
		client.get('/api/hubba/resource_types', function(err, req, res, data) {
			resourceTypes = data;
			done();
		});
	});
	
	it('GET /api/hubba/resources should get a 200 response', function(done) {
		client.get('/api/hubba/resources', function(err, req, res, data) {
			assert.ifError(err);
			rootId = data.id;
			done();
		});
	});
	
	it('POST /api/hubba/resources should get a 200 response for '+resourceTypes.length+' resource types.', function(done) {
		var cnt = 0;
		resourceTypes.forEach(function(type, index){
			client.post('/api/hubba/resources', {
				parentId: rootId,
				name: type+'_resource',
				type: type,
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
	});
	
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