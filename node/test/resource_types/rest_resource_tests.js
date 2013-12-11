"use strict";

var assert = require("assert-plus");


describe('rest resource NODE API tests', function() {
	var root, r, resource = require('../../lib/resource');
	 
	// generate root resource
	it(' should generate a root resource.', function(done){
		root = resource.generateResources();
		done();
	});
	
	
	// add new rest resource
	it(' should create a new rest resource with the name rest_resource',function(done){
		r = resource.findById(root.id).addChild({
			parentId: root.id,
			name: "rest_resource",
			type: "rest"
		}).toJson({includeChildren:true});
		assert.equal(r.type,"rest","Rest resource has incorrect type! should be 'rest', is actually " + r.type);
		assert.equal(r.name,"rest_resource","Rest resource has incorrect name! shouldbe be 'rest_resource is actually " + r.name);
		done();
	});
	
	// update resource name, url, and params
	it (' should update the resource name, url, and params',function(done){
		var name = "google_proxy", url = "http://www.google.com", params = "q=hubba";
		
		r = resource.findById(r.id).update({
			name:name,
			configuration: {
				url:url,
				params:params
			}
		}).toJson();
		assert.equal(r.type,"rest","Rest resource has incorrect type! should be 'rest', is actually " + r.type);
		assert.equal(r.name,name,"Rest resource has incorrect url! should be be "+name+" is actually " + r.name);
		assert.equal(r.configuration.url,url,"Rest resource has incorrect url! should be be "+url+" is actually " + r.configuration.url);
		assert.equal(r.configuration.params,params,"Rest resource has incorrect url! should be be "+params+" is actually " + r.configuration.params);
		done();	
	});
	
	// update resource url to something invalid
	it (' should return an error when updating the url to a number',function(done){		
		assert.throws(function(){
			resource.findById(r.id).update({
				configuration: {
					url:123
				}
			});
		});
		done();	
	});
	
	// update resource params to something invalid
	it (' should return an error when updating the url to a number',function(done){		
		assert.throws(function(){
			resource.findById(r.id).update({
				configuration: {
					params:[]
				}
			});
		});
		done();	
	});
	
	// delete rest resource
	it (' should delete the rest resource.',function(done){
		resource.findById(r.id).del();
		assert.throws(function(){resource.findById(r.id)});
		done();	
	});
});

describe('rest resource REST API tests', function() {
	require('../../lib/server').startup({
		port: 8081
	});
	
	var rootId, id, client = require('restify').createJsonClient({
	    version: '*',
	    url: 'http://127.0.0.1:8081'
	}), httpClient = require('restify').createClient({
	    version: '*',
	    url: 'http://127.0.0.1:8081'
	});
	
	// get the root id
	it('GET /hubba/api/resources Root id should return a 200 response', function(done) {
		client.get('/hubba/api/resources', function(err, req, res, data) {
			assert.ifError(err);
			rootId = data.id;
			done();
		});
	});
	
	// add new rest resource
	it('POST new area resource called "rest_resource" to /hubba/api/resources should return a 200 response.', function(done) {
	
		client.post('/hubba/api/resources', {
			"parentId": rootId,
			"name": "rest_resource",
			"type": "rest"
		}, function(err, req, res, data) {
			assert.ifError(err);
			id = data.id;
			client.get('/api/rest_resource', function(err, req, res, data){
				assert.ifError(err);
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