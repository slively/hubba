var assert = require("assert-plus");
/*var client = require('restify').createJsonClient({
    version: '*',
    url: 'http://127.0.0.1:8081'
});

var rootId, id;

describe('area resource tests', function() {
	require('../../lib/server').startup({
		port: 8081
	});
	
	it('GET /hubba/api/resources Root id should get a 200 response', function(done) {
		client.get('/hubba/api/resources', function(err, req, res, data) {
			assert.ifError(err);
			rootId = data.id;
			done();
		});
	});
	
	it('POST new area resource called "area_resource" to /hubba/api/resources should get a 200 response.', function(done) {
	
		client.post('/hubba/api/resources', {
			"parentId": rootId,
			"name": "area_resource",
			"type": "area"
		}, function(err, req, res, data) {
			assert.ifError(err);
			id = data.id;
				
			client.get('/api/area_resource', function(err, req, res, data){
				assert.ifError(err);
				done();
			});

		});
		
	});
	
	it('PUT /hubba/api/resources should update the name to "area_resource_renamed", path to "/api/area_resource_renamed", and get a 200 response.', function(done) {	
	   client.put('/hubba/api/resources/'+id, {
			name : 'area_resource_renamed'
		}, function(err, req, res, data) {
			assert.ifError(err);
            client.get('/api/area_resource_renamed', function(err, req, res, data){
				assert.ifError(err);
				done();
			});
        });
	});    
	
	
	it('DELETE /hubba/api/resources should delete "area_resource_renamed" get a 200 response.', function(done) {	
        client.del('/hubba/api/resources/'+id, function(err, req, res, data) {
			assert.ifError(err);
			client.get('/api/area_resource_renamed', function(err, req, res, data){
				assert.object(err);
				done();
			});
		});
	});
});*/

describe('Resource REST API tests', function() {
	
	var Server = require('../../lib/server').startup({
		port: 8081
	});
	
	var rootId, id, child_id, client = require('restify').createJsonClient({
	    version: '*',
	    url: 'http://127.0.0.1:8081'
	});
	
	it('GET /hubba/api/resources Root id should return a 200 response', function(done) {
		client.get('/hubba/api/resources', function(err, req, res, data) {
			assert.ifError(err);
			rootId = data.id;
			done();
		});
	});
	
	it('GET /api should return a 200 response', function(done) {
		client.get('/api', function(err, req, res, data) {
			assert.ifError(err);
			done();
		});
	});

	it('root resource should throw an error when adding a child without a name, type, or parentId', function(done) {
		client.post('/hubba/api/resources', { type : 'area', parentId: rootId }, function(err){
			assert.ok(err);
			client.post('/hubba/api/resources', { name : 'test', parentId: rootId }, function(err){
				assert.ok(err);
				client.post('/hubba/api/resources', { type : 'area', name : 'test' }, function(err){
					assert.ok(err);
					done();
				});
			});
		});
	});
	
	it('root resource should add a child, which should be accessible from /hubba/api and /api, and get a 200 response', function(done){
		client.post('/hubba/api/resources', {
			"parentId": rootId,
			"name": "area_resource",
			"type": "area"
		}, function(err, req, res, data) {
			assert.ifError(err);
			id = data.id;
			
			client.get('/hubba/api/resources/'+id,function(err){
				assert.ifError(err);
				client.get('/api/area_resource', function(err, req, res, data){
					assert.ifError(err);
					done();
				});
			});
		});
	});
	
	it('root resource should not be allowed to add another resource with the same name.',function(done){
		client.post('/hubba/api/resources', {
			"parentId": rootId,
			"name": "area_resource",
			"type": "area"
		}, function(err, req, res, data) {
			assert.ok(err);
			done();
		});
	});
	
	it('area_resource should add a child called "area_resource_child", which should be accessible from /hubba/api and /api, and get a 200 response', function(done){
		client.post('/hubba/api/resources', {
			"parentId": id,
			"name": "area_resource_child",
			"type": "area"
		}, function(err, req, res, data) {
			assert.ifError(err);
			child_id = data.id;
			
			client.get('/hubba/api/resources/'+id,function(err){
				assert.ifError(err);
				client.get('/api/area_resource/area_resource_child', function(err, req, res, data){
					assert.ifError(err);
					done();
				});
			});
		});
	});
	
	
	it('area_resource_child should be renamed to "area_resource_child_r", and the path should be updated. The old path should no longer be accessible.', function(done){
		client.put('/hubba/api/resources/'+child_id, {
			"name": "area_resource_child_r"
		}, function(err, req, res, data) {
			assert.ifError(err);
			assert.equal("area_resource_child_r",data.name);
			assert.equal("/api/area_resource/area_resource_child_r",data.path);
			client.get('/api/area_resource/area_resource_child_r',function(err,req,res,data){
				assert.ifError(err);
				client.get('/api/area_resource/area_resource_child',function(err, req, res, data){
					assert.ok(err, "Old route still resolved.");
					done();
				});
			});
		});
	});
	
	it('area_resource should be renamed to "area_resource_r", the path should be updated, the old path should no longer be accessible, and the child resources paths should be updated.', function(done){
		client.put('/hubba/api/resources/'+id+'?include_children=true', {
			"name": "area_resource_r"
		}, function(err, req, res, data) {
			assert.ifError(err);
			assert.equal("area_resource_r",data.name);
			assert.equal("/api/area_resource_r",data.path);
			assert.equal("/api/area_resource_r/area_resource_child_r",data.children.area_resource_child_r.path);
			client.get('/api/area_resource_r',function(err){
				assert.ifError(err);
				
				client.get('/api/area_resource_r/area_resource_child_r', function(err, req, res, data){
					assert.ifError(err);
					client.get('/api/area_resource', function(err, req, res, data){
						//console.log(Server.router.mounts);
						//console.log(req);
						//console.log(res);
						assert.ok(err, "Old route still resolved.");
						done();
					});
				});
			});
		});
	});
	
	it('The root resource should throw an error when attempting to delete.',function(done){
		client.del('/hubba/api/resources/'+rootId,function(err,req,res,data){
			assert.ok(err);
			done();
		});
	});
	
	it('area_resource_r should throw an error when attemping to delete because it has children.',function(done){
		client.del('/hubba/api/resources/'+id,function(err,req,res,data){
			assert.ok(err);
			done();
		});
	});
	
	it('area_resource_child_r should be deleted.',function(done){
		client.del('/hubba/api/resources/'+child_id,function(err,req,res,data){
			assert.ifError(err);
			done();
		});
	});
	
	it('GET /api/area_resource_r/area_resource_child_r should no longer resolve.',function(done){
		client.get('/api/area_resource_r/area_resource_child_r', function(err, req, res, data){
			assert.ok(err, "Old route still resolved.");
			done();
		});
	});
	
	
	it('area_resource_r should be deleted.',function(done){
		client.del('/hubba/api/resources/'+id,function(err,req,res,data){
			assert.ifError(err);
			done();
		});
	});
	
	it('GET /api/area_resource_r should no longer resolve.',function(done){
		client.get('/api/area_resource_r', function(err, req, res, data){
			assert.ok(err, "Old route still resolved.");
			done();
		});
	});

});
