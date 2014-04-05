var assert = require("assert-plus");

/*
    Any test with a large timeout is dependant on the external API, which is terribly slow.
 */

describe('Soap Resource', function() {
	
	var rootId, id, client = require('restify').createJsonClient({
	    version: '*',
	    url: 'http://127.0.0.1:8081'
	});
	
	it('GET /hubba/api/resources Root id should return a 200 response', function(done) {
		client.get('/hubba/api/resources/root', function(err, req, res, data) {
			assert.ifError(err);
			rootId = data.id;
			done();
		});
	});
	
	it('POST new soap resource called "soap_resource" to /hubba/api/resources should return a 200 response.', function(done) {
	
		client.post('/hubba/api/resources', {
			"parentId": rootId,
			"name": "soap_resource",
			"type": "soap"
		}, function(err, req, res, data) {
			assert.ifError(err);
			id = data.id;
			done();
		});
		
	});
	
	it('GET of new soap resource should return error because WSDL is not defined.', function(done){
		client.get('/api/soap_resource', function(err, req, res, data){
			assert.object(err);
			done();
		});
	});
	
	it('PUT /hubba/api/resources should update "soap_resource" to "weather_proxy" and return a 200 response.', function(done) {	
		var name = "weather_proxy", WSDLURL = "http://www.webservicex.net/usweather.asmx?WSDL";
		
	   client.put('/hubba/api/resources/'+id, 	{
			name:name,
			configuration: {
				WSDLURL:WSDLURL
			}
		}, function(err, req, res, data) {
			assert.ifError(err);
			assert.equal(data.type,"soap","SOAP resource has incorrect type! should be 'soap', is actually " + data.type);
			done();
        });
	});    
	
	it('GET of /api/weather_proxy should retun the WSDL in JSON.',function(done){
		this.timeout(25000);
		client.get('/api/weather_proxy', function(err, req, res, data){
			assert.ifError(err);
			assert.object(data);
			done();
		});
	});
	
	it('POST of /api/weather_proxy should retun the weather for Chicago.',function(done){
        this.timeout(25000);
		client.post('/api/weather_proxy/USWeather/USWeatherSoap12/GetWeatherReport', {"input":{"ZipCode":"60657"}}, function(err, req, res, data){
			assert.ifError(err);
			assert.object(data);
			done();
		});
	});
	
	it('PUT /hubba/api/resources should update "weather_proxy" to "currency_proxy" and return a 200 response.', function(done) {	
		var name = "currency_proxy", WSDLURL = "http://www.webservicex.net/CurrencyConvertor.asmx?WSDL";
		
	   client.put('/hubba/api/resources/'+id, 	{
			name:name,
			configuration: {
				WSDLURL:WSDLURL
			}
		}, function(err, req, res, data) {
			assert.ifError(err);
			assert.equal(data.type,"soap","SOAP resource has incorrect type! should be 'soap', is actually " + data.type);
			done();
        });
	});    
	
	it('GET of /api/currency_proxy should retun the WSDL in JSON.',function(done){
		this.timeout(25000);
		client.get('/api/currency_proxy', function(err, req, res, data){
			assert.ifError(err);
			assert.object(data);
			done();
		});
	});
	
	it('DELETE /hubba/api/resources should delete "weather_proxy" return a 200 response.', function(done) {	
        client.del('/hubba/api/resources/'+id, function(err, req, res, data) {
			assert.ifError(err);
            done();
		});
	});
	
});