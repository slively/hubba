"use strict";

var assert = require("assert-plus");


describe('Rest Resource', function() {

	var rootId, id, client = require('restify').createJsonClient({
	    version: '*',
	    url: 'http://127.0.0.1:8081'
	}), httpClient = require('restify').createClient({
	    version: '*',
	    url: 'http://127.0.0.1:8081'
	});
	
	// get the root id
    it('GET /hubba/api/resources/root should return a 200 response and return only a root resource.', function(done) {
        client.get('/hubba/api/resources/root', function(err, req, res, data) {
            assert.ifError(err);
            assert.ok(data.id);
            rootId = data.id;
            done();
        });
    });
	
	// add new rest resource
	it('POST new rest resource called "rest_resource" to /hubba/api/resources should return a 200 response.', function(done) {
	
		client.post('/hubba/api/resources', {
			"parentId": rootId,
			"name": "rest_resource",
			"type": "rest"
		}, function(err, req, res, data) {
			assert.ifError(err);
			id = data.id;
			client.get('/api/rest_resource', function(err, req, res, data){
				assert.ok(err.message.indexOf('Invalid URI') > -1);
				done();
			});
		});
		
	});
	
	// update resource name, url, and params
	it('PUT /hubba/api/resources should update "rest_resource" to "google_proxy" and return a 200 response.', function(done) {	
		var name = "google_proxy", url = "http://www.google.com", params = "q=hubba";
		
	   client.put('/hubba/api/resources/'+id, 	{
			name:name,
			configuration: {
				url:url,
				params:params
			}
		}, function(err, req, res, data) {
			assert.ifError(err);
			assert.equal(data.type,"rest","Rest resource has incorrect type! should be 'rest', is actually " + data.type);
			assert.equal(data.name,name,"Rest resource has incorrect url! should be be "+name+" is actually " + data.name);
			assert.equal(data.configuration.url,url,"Rest resource has incorrect url! should be be "+url+" is actually " + data.configuration.url);
			assert.equal(data.configuration.params,params,"Rest resource has incorrect url! should be be "+params+" is actually " + data.configuration.params);
			
			// Test actual proxy
            httpClient.get('/api/google_proxy', function(err, req){
				assert.ifError(err);
				
				req.on('result', function(err, res) {
				    assert.ifError(err); // HTTP status code >= 400

				    res.body = '';
				    res.setEncoding('utf8');
				    res.on('data', function(chunk) {
				      res.body += chunk;
				    });

				    res.on('end', function() {
						assert.ok(res.body.length,"No information received from google!")
						done();
				    });
				  });
				
			});
        });
	});    
	
	// delete rest resource
	it('DELETE /hubba/api/resources should delete "rest_resource_renamed" return a 200 response.', function(done) {	
        client.del('/hubba/api/resources/'+id, function(err, req, res, data) {
			assert.ifError(err);
            done();
		});
	});
	
});