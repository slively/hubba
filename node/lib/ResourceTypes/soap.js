"use strict";

/*
arraySelect: { inputType: 'select', placeholder:'multiple', value: [], options: ['test1', 'test2', 'etc...'], required: true, multiple: true },
select: { inputType: 'select', placeholder:'multiple', value: [], options: ['test1', 'test2', 'etc...'], required: true },
radio: { inputType: 'radio', value: 'test1', options: ['test1', 'test2', 'etc...'], required: true, header: 'Radios Woo!' },
check: { inputType: 'checkbox', value:true, header: 'Checkbox Woo!' }
*/

var soap = require('soap');

function init(resource){
	if (resource.ResourceType.config.WSDLURL.value.length){
		soap.createClient(resource.ResourceType.config.WSDLURL.value, function(err, c) {
			if (err){
				console.log(err);
				return;
			}
		
			resource.ResourceType.SOAPClient = c;
			
			if (resource.ResourceType.config.username.value.length && resource.ResourceType.config.password.value.length){
				client.setSecurity(new WSSecurity(resource.ResourceType.config.username.value, resource.ResourceType.config.password.value));
			}
		});
	}
}

exports.ResourceType = {
	name: 'soap',
	label: 'SOAP Proxy',
	config: {
		WSDLURL: { inputType: 'text', placeholder:'Enter the url for the REST resource. (ex./ http://myservice/resource)', value: '', required: true },
		username: { inputType: 'text', placeholder:'Enter a username for authentication.', value: '' },
		password: { inputType: 'password', placeholder:'Enter a password for authentication.', value: '' }
	},
	GET: function(resource,req,res){
		if (resource.ResourceType.SOAPClient){
			res.send(resource.ResourceType.SOAPClient.describe());
		} else {
			res.send(400,'Cannot describe resource. Either the WSDL URL is incorrect or the external SOAP resource is currently unavailable please check your resource config and that the external SOAP resource is available.')
		}
	},
	POST: function(resource, req,res){
		if (resource.ResourceType.SOAPClient){
			if (req.params.length > 2){			
				resource.ResourceType.SOAPClient[req.params[0]][req.params[1]][req.params[2]](req.body, function(err, result) {
					if (err){
						throw err;
					}
					res.send(result);
				});
			} else {
				resource.ResourceType.SOAPClient[req.params[0]](req.body, function(err, result) {
					if (err){
						throw err;
					}
					res.send(result);
				});
			}
		} else {
			res.send(400,'Could not create SOAP client from current WSDL URL. Please update in the resource config.')
		}
	},
	RESOURCE_CREATE: init,
	RESOURCE_UPDATE: init
};