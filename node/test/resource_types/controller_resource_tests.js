var assert = require("assert-plus");

describe('controller resource REST API tests', function() {
	require('../../lib/server').startup({
		port: 8081
	});
	
	var rootId, 
		id, 
		client = require('restify').createJsonClient({
		    version: '*',
		    url: 'http://127.0.0.1:8081'
		}), 
		httpClient = require('restify').createClient({
		    version: '*',
		    url: 'http://127.0.0.1:8081'
		});
	
	// get the root id
	it('GET /hubba/api/resources Root id should get a 200 response', function(done) {
		client.get('/hubba/api/resources', function(err, req, res, data) {
			assert.ifError(err);
			rootId = data.id;
			done();
		});
	});
	
	it('POST new controller resource called "controller_resource" to /hubba/api/resources should get a 200 response and a the default 405 response when calling the new resource.', function(done) {
	
		client.post('/hubba/api/resources', {
			"parentId": rootId,
			"name": "controller_resource",
			"type": "controller"
		}, function(err, req, res, data) {
			assert.ifError(err);
			id = data.id;
			client.get('/api/controller_resource', function(err, req, res, data){
				assert.throws(err);
				done();
			});
		});
		
	});
		
	it('PUT /hubba/api/resources/:id should update resources get,put,post,path,delete code and get a 200 response.', function(done) {	
		var get = "res.send('get');", 
			post = "res.send('post');", 
			put = "res.send('put');", 
			patch = "res.send('patch');", 
			del = "res.send('delete');",
			callbackCnt = 0;
		
	
	   client.put('/hubba/api/resources/'+id, 	{
			"configuration": {
				"get": get,
				"post": post,
				"put": put,
				"patch": patch,
				"del": del
			}
		}, function(err, req, res, r) {
			assert.ifError(err);
			
			assert.equal(r.type,"controller","Resource has incorrect type! should be 'controller', is actually " + r.type);
			assert.equal(r.configuration.get,get,"Resource has incorrect get! should be be "+get+" is actually " + r.configuration.get);
			assert.equal(r.configuration.post,post,"Resource has incorrect post! should be be "+post+" is actually " + r.configuration.post);
			assert.equal(r.configuration.put,put,"Resource has incorrect put! should be be "+put+" is actually " + r.configuration.put);
			assert.equal(r.configuration.patch,patch,"Resource has incorrect get! should be be "+patch+" is actually " + r.configuration.patch);
			assert.equal(r.configuration.del,del,"Resource has incorrect del! should be be "+del+" is actually " + r.configuration.del);

			done();
		});
    });  

	it('GET /api/controller_resource should return "get"', function(done){
		httpClient.get('/api/controller_resource', function(err, req){
			assert.ifError(err);
			req.on('result', function(err, res) {
			    assert.ifError(err); // HTTP status code >= 400
			    res.body = '';
			    res.setEncoding('utf8');
			    res.on('data', function(chunk) {
			      res.body += chunk;
				});

				res.on('end', function() {
					assert.equal(res.body,'"get"');
					done();
				});
			});
	  	});
	});
	
	it('POST /api/controller_resource should return "post"', function(done){
		httpClient.post('/api/controller_resource', function(err, req){
			assert.ifError(err);
			req.on('result', function(err, res) {
			    assert.ifError(err); // HTTP status code >= 400
			    res.body = '';
			    res.setEncoding('utf8');
			    res.on('data', function(chunk) {
			      res.body += chunk;
				});

				res.on('end', function() {
					assert.equal(res.body,'"post"');
					done();
				});
			});
			req.end();
	  	});
	});
	
	it('PUT /api/controller_resource should return "put"', function(done){
		httpClient.put('/api/controller_resource', function(err, req){
			assert.ifError(err);
			req.on('result', function(err, res) {
			    assert.ifError(err); // HTTP status code >= 400
			    res.body = '';
			    res.setEncoding('utf8');
			    res.on('data', function(chunk) {
			      res.body += chunk;
				});

				res.on('end', function() {
					assert.equal(res.body,'"put"');
					done();
				});
			});
			req.end();
	  	});
	});
	
	it('PATCH /api/controller_resource should return "patch"', function(done){
		httpClient.patch('/api/controller_resource', function(err, req){
			assert.ifError(err);
			req.on('result', function(err, res) {
			    assert.ifError(err); // HTTP status code >= 400
			    res.body = '';
			    res.setEncoding('utf8');
			    res.on('data', function(chunk) {
			      res.body += chunk;
				});

				res.on('end', function() {
					assert.equal(res.body,'"patch"');
					done();
				});
			});
			req.end();
	  	});
	});
	
	it('DELETE /api/controller_resource should return "delete"', function(done){
		httpClient.del('/api/controller_resource', function(err, req){
			assert.ifError(err);
			req.on('result', function(err, res) {
			    assert.ifError(err); // HTTP status code >= 400
			    res.body = '';
			    res.setEncoding('utf8');
			    res.on('data', function(chunk) {
			      res.body += chunk;
				});

				res.on('end', function() {
					assert.equal(res.body,'"delete"');
					done();
				});
			});
	  	});
	});
	
	it('PUT /hubba/api/resources/:id should update resources get to send "this" in the controller code, which should return nothing.', function(done) {	
		var get = "res.send(this);";
		
	
	   client.put('/hubba/api/resources/'+id, 	{
			"configuration": {
				"get": get,
			}
		}, function(err, req, res, r) {
			assert.ifError(err);
			
			httpClient.get('/api/controller_resource', function(err, req){
				assert.ifError(err);
				req.on('result', function(err, res) {
				    assert.ifError(err); // HTTP status code >= 400
				    res.body = '';
				    res.setEncoding('utf8');
				    res.on('data', function(chunk) {
				      res.body += chunk;
					});

					res.on('end', function() {
						assert.equal(res.body,'');
						done();
					});
				});
		  	});
			
		});
    });

	it('PUT /hubba/api/resources/:id should update resources get to send 123 in the controller code.', function(done) {	
		var get = "res.send(200,123);";
		
	
	   client.put('/hubba/api/resources/'+id, 	{
			"configuration": {
				"get": get,
			}
		}, function(err, req, res, r) {
			assert.ifError(err);
			
			httpClient.get('/api/controller_resource', function(err, req){
				assert.ifError(err);
				req.on('result', function(err, res) {
				    assert.ifError(err); // HTTP status code >= 400
				    res.body = '';
				    res.setEncoding('utf8');
				    res.on('data', function(chunk) {
				      res.body += chunk;
					});

					res.on('end', function() {
						assert.equal(res.body,123);
						done();
					});
				});
		  	});
			
		});
    });

	it('PUT /hubba/api/resources/:id should update resources get code return "t", which is the temporary variable holding the controller code, which should return nothing.', function(done) {	
		var get = "res.send(t);";
		
	
	   client.put('/hubba/api/resources/'+id, 	{
			"configuration": {
				"get": get,
			}
		}, function(err, req, res, r) {
			assert.ifError(err);
			
			httpClient.get('/api/controller_resource', function(err, req){
				assert.ifError(err);
				req.on('result', function(err, res) {
				    assert.ifError(err); // HTTP status code >= 400
				    res.body = '';
				    res.setEncoding('utf8');
				    res.on('data', function(chunk) {
				      res.body += chunk;
					});

					res.on('end', function() {
						assert.equal(res.body,'');
						done();
					});
				});
		  	});
			
		});
    });
	
	it('DELETE /hubba/api/resources should delete "controller_resource" get a 200 response.', function(done) {	
        client.del('/hubba/api/resources/'+id, function(err, req, res, data) {
			assert.ifError(err);
            done();
		});
	});
	
});