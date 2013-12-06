var assert = require("assert");

describe('email resource', function() {
    var server = require('../../lib/server').startup({
        port: 8081
    });

    var rootId, id, client = require('restify').createJsonClient({
        version: '*',
        url: 'http://127.0.0.1:8081'
    });

	// get root resource
	it('GET /hubba/api/resources should get a 200 response', function(done) {
		client.get('/hubba/api/resources', function(err, req, res, data) {
			assert.ifError(err);
			rootId = data.id;
			done();
		});
	});
	
	// add new email resource
	it('should get added to the root resource', function(done) {
	
		client.post('/hubba/api/resources', {
			parentId: rootId,
			name: 'email_resource_test',
			type: 'email',
            configuration: {
                "host": "smtp.gmail.com",
                "port": 465,
                "ssl": true,
                "username":"testhubba@gmail.com",
                "password":"hubbahubba"
            }
		}, function(err, req, res, data) {
			assert.ifError(err);
			id = data.id;
            assert.equal('smtp.gmail.com',data.configuration.host);
            assert.equal(465,data.configuration.port);
            assert.equal(true,data.configuration.ssl);
            assert.equal('testhubba@gmail.com',data.configuration.username);
            assert.equal('hubbahubba',data.configuration.password);
            done();
		});
		
	});

	
	it('should successfully send an email.', function(done) {

        client.post('/api/email_resource_test', {
            from: "testhubba@gmail.com",
            to: "testhubba@gmail.com",
            subject: "Hello world!",
            text: "Plaintext body",
            html: "<h1>Big HTML body!</h1>"
        }, function(err, req, res, data) {
			assert.ifError(err);
			console.log(data);
			done();
        });

	});
	

    it('DELETE /hubba/api/resources should delete "email_resource_test" return a 200 response.', function(done) {
        client.del('/hubba/api/resources/'+id, function(err, req, res, data) {
            assert.ifError(err);
            done();
        });
    });

});