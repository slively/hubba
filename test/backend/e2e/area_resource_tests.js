var assert = require("assert-plus");

describe('Area Resource', function() {
	
	var rootId, id, child_id, client = require('restify').createJsonClient({
	    version: '*',
	    url: 'http://127.0.0.1:8081'
	});
	
	it('GET /hubba/api/resources/root should return a 200 response and return only a root resource.', function(done) {
		client.get('/hubba/api/resources/root', function(err, req, res, data) {
			assert.ifError(err);
            assert.ok(data.id);
			rootId = data.id;
            client.get('/hubba/api/resources', function(err, req, res, data) {
                done();
            });

		});
	});
	
	it('GET /api should return a 200 response', function(done) {
		client.get('/api', function(err, req, res, data) {
			assert.ifError(err);
			done();
		});
	});

	it('root resource should throw an error when adding a child without a name', function(done) {
		client.post('/hubba/api/resources', { type : 'area', parentId: rootId }, function(err){
			assert.ok(err.message.indexOf('Resource must have a name of length > 0') > -1);
			done();
		});
	});

    it('root resource should throw an error when adding a child without a type', function(done) {
        client.post('/hubba/api/resources', { name : 'test', parentId: rootId }, function(err){
            assert.ok(err.message.indexOf('Resource type undefined is invalid') > -1);
            done();
        });
    });

    it('root resource should throw an error when adding a child without a parentId', function(done) {
        client.post('/hubba/api/resources', { type : 'area', name : 'test' }, function(err){
            assert.ok(err.message.indexOf('A non-root resource must define a parentId') > -1);
            done();
        });
    });
	
	it('root resource should add a child, which should be accessible from /hubba/api and /api, and get a 200 response', function(done){
		client.post('/hubba/api/resources', {
			"parentId": rootId,
			"name": "area_resource",
			"type": "area"
		}, function(err, req, res, data) {
			assert.ifError(err);
            assert.ok(data.id);
			id = data.id;

			client.get('/hubba/api/resources/'+id,function(err, req, res, data){
				assert.ifError(err);
                assert.equal(data.id,id);

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

    // TODO this doesn't work if done twice because of the server.rm garbage!
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
	
	
	it('area_resource_child should be renamed to "area_resource_child_r", and the path should be updated.', function(done){
		client.put('/hubba/api/resources/'+child_id, {
			"name": "area_resource_child_r"
		}, function(err, req, res, data) {
			assert.ifError(err);
			assert.equal("area_resource_child_r",data.name);
			assert.equal("/api/area_resource/area_resource_child_r",data.path);
			client.get('/api/area_resource/area_resource_child_r',function(err,req,res,data){
				assert.ifError(err);
                done();
			});
		});
	});


    it('The old path /api/area_resource/area_resource_child should no longer be accessible.',function(done){

        client.get('/api/area_resource/area_resource_child',function(err, req, res, data){
            assert.ok(err, "Old route still resolved.");
            done();
        });

    });
	
	it('area_resource should be renamed to "area_resource_r", the path should be updated.', function(done){
		client.put('/hubba/api/resources/'+id+'', {
			"name": "area_resource_r"
		}, function(err, req, res, data) {
			assert.ifError(err);
			assert.equal("area_resource_r",data.name);
			assert.equal("/api/area_resource_r",data.path);

			client.get('/api/area_resource_r',function(err){
				assert.ifError(err);
                done();
			});
		});
	});

    it('The children paths should be updated.',function(done){
        client.get('/api/area_resource_r/area_resource_child_r', function(err, req, res, data){
            assert.ifError(err);
            done();
        });
    });

    /* AAAGGGHHH!
    it('The old path /api/area_resource should no longer be accessible.',function(done){
        client.get('/api/area_resource', function(err, req, res, data){
            assert.ok(err, "Old route still resolved.");
            done();
        });
    });*/
	
	it('The root resource should throw an error when attempting to delete.',function(done){
		client.del('/hubba/api/resources/'+rootId,function(err,req,res,data){
            assert.ok(err.message.indexOf('You must delete the children of a resource') > -1);
			done();
		});
	});
	
	it('area_resource_r should throw an error when attemping to delete because it has children.',function(done){
		client.del('/hubba/api/resources/'+id,function(err,req,res,data){
			assert.ok(err.message.indexOf('You must delete the children of a resource') > -1);
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
