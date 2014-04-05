"use strict";

var assert = require("assert-plus");


describe('Rest Resource', function() {

	var rootId, id, client = require('restify').createJsonClient({
	    version: '*',
	    url: 'http://127.0.0.1:8081'
	}), testClient = require('restify').createJsonClient({
        version: '*',
        url: 'http://127.0.0.1:8081',
        headers: {'testheader':'test-value', 'accept-encoding':'gzip'}
    });

    it('GET /hubba/api/resources/root should return a 200 response and return only a root resource.', function(done) {
        client.get('/hubba/api/resources/root', function(err, req, res, data) {
            assert.ifError(err);
            assert.ok(data.id);
            rootId = data.id;
            done();
        });
    });

	it('POST new rest resource called "rest_resource" to /hubba/api/resources and should return an error because no url is defined.', function(done) {
	
		client.post('/hubba/api/resources', {
			"parentId": rootId,
			"name": "rest_resource",
			"type": "rest"
		}, function(err, req, res, data) {
            assert.ok(err.message.indexOf('required: url') > -1, 'Should have gotten an error when creating resource.');
			done();
		});
		
	});

    it('POST new rest resource called "rest_resource" to /hubba/api/resources and get a 200 response.', function(done) {

        client.post('/hubba/api/resources', {
            "parentId": rootId,
            "name": "rest_resource",
            "type": "rest",
            configuration: {
                url: 'temp'
            }
        }, function(err, req, res, data) {
            assert.ifError(err);
            id = data.id;
            done();
        });

    });

	it('PUT /hubba/api/resources should update "rest_resource" to "test_proxy" and return a 200 response.', function(done) {
		var name = "test_proxy", url = "http://127.0.0.1:8081/api-test/rest", params = "a=123", headers = "hard-coded:true\nblank:\nanother:exists";
		
	   client.put('/hubba/api/resources/'+id, 	{
			name:name,
			configuration: {
				url:url,
				params:params,
                headers: headers
			}
		}, function(err, req, res, data) {
			assert.ifError(err);
			assert.equal(data.type,"rest","Rest resource has incorrect type! should be 'rest', is actually " + data.type);
			assert.equal(data.name,name,"Rest resource has incorrect url! should be be "+name+" is actually " + data.name);
			assert.equal(data.configuration.url,url,"Rest resource has incorrect url! should be be "+url+" is actually " + data.configuration.url);
		    assert.equal(data.configuration.params,params,"Rest resource has incorrect url! should be be "+params+" is actually " + data.configuration.params);
            assert.equal(data.configuration.headers,headers);
            assert.equal(data.configuration.fwdUrl,true,'fwdUrl');
            assert.equal(data.configuration.fwdQuery,true,'fwdQuery');
            assert.equal(data.configuration.fwdBody,true,'fwdBody');
            assert.equal(data.configuration.fwdHeaders,true,'fwdHeaders');
            done();
        });
	});

    it('should call the /api/test_proxy service and receive the headers, path, query params, and body sent.',function(done){
        testClient.get('/api/test_proxy', function(err, req, res, data){
            assert.ifError(err,err);
            assert.equal(data.path,'/api-test/rest');
            assert.equal(data.headers['hard-coded'],'true');
            assert.equal(data.headers['blank'],'');
            assert.equal(data.headers['another'],'exists');
            done();
        });
    });

    it('should call the /api/test_proxy as /api/test_proxy/resource/1?a=1&b=2 and receive back the correct path and query parameters.',function(done){

        testClient.post('/api/test_proxy/resource/1?a=1&b=2', {data:{the:{data:'is here!'}}}, function(err, req, res, data){
            assert.ifError(err,err);
            assert.equal(data.path,'/api-test/rest/resource/1');
            assert.equal(JSON.stringify(data.query),'{"a":"123","b":"2"}');
            assert.equal(JSON.stringify(data.body),'{"data":{"the":{"data":"is here!"}}}');
            assert.equal(data.headers.testheader,'test-value');
            done();
        });

    });

    it('PUT /hubba/api/resources should "test_proxy" to no longer forward the url, query, and body params.', function(done) {
        var name = "test_proxy", url = "http://127.0.0.1:8081/api-test/rest", params = "";

        client.put('/hubba/api/resources/'+id, 	{
            configuration: {
                fwdUrl: false,
                fwdQuery: false,
                fwdBody: false,
                fwdHeaders: false
            }
        }, function(err, req, res, data) {
            assert.ifError(err);
            assert.equal(data.configuration.fwdUrl,false,'fwdUrl');
            assert.equal(data.configuration.fwdQuery,false,'fwdQuery');
            assert.equal(data.configuration.fwdBody,false,'fwdBody');
            assert.equal(data.configuration.fwdHeaders,false,'fwdHeaders');
            done();
        });
    });

    it('should call the /api/test_proxy as /api/test_proxy/nogood and should get a 404 error because url forwarding is not on.',function(done){

        testClient.post('/api/test_proxy/nogood', {data:{the:{data:'is here!'}}}, function(err, req, res, data){
            assert.ok(err != null,'Expected 404 error.');
            assert.equal(err.statusCode,404);
            assert.ok(err.message.indexOf('URL forwarding is not allowed on this resource)' > -1));
            done();
        });

    });

    it('should call the /api/test_proxy as /api/test_proxy?a=2&b=2 and not receive back the query params or body.',function(done){
        testClient.post('/api/test_proxy?a=1&b=2', {data:{the:{data:'is here!'}}}, function(err, req, res, data){
            assert.ifError(err);
            assert.equal(JSON.stringify(data.query),'{"a":"123"}');
            assert.equal(JSON.stringify(data.body),'{}');
            assert.equal(data.headers.testheader,undefined);
            done();
        });
    });

	it('DELETE /hubba/api/resources should delete "test_proxy" return a 200 response.', function(done) {
        client.del('/hubba/api/resources/'+id, function(err, req, res, data) {
			assert.ifError(err);
            done();
		});
	});

});