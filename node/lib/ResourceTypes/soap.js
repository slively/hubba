"use strict";

/*
arraySelect: { inputType: 'select', placeholder:'multiple', value: [], options: ['test1', 'test2', 'etc...'], required: true, multiple: true },
select: { inputType: 'select', placeholder:'multiple', value: [], options: ['test1', 'test2', 'etc...'], required: true },
radio: { inputType: 'radio', value: 'test1', options: ['test1', 'test2', 'etc...'], required: true, header: 'Radios Woo!' },
check: { inputType: 'checkbox', value:true, header: 'Checkbox Woo!' }
*/

var soap = require('soap');

function init(){
	var self = this;
	
	if (this.ResourceType.configuration.WSDLURL.value.length){
		
		if (this.ResourceType.SOAPClient){
			delete this.ResourceType.SOAPClient;
		}
		
		this.ResourceType.connecting = true;
		this.ResourceType.waitingQueue = [];	
		
		soap.createClient(this.ResourceType.configuration.WSDLURL.value, function(err, c) {
			
			self.ResourceType.connecting = false;
			
			if (err){
				throw err;
				return;
			}
						
			self.ResourceType.SOAPClient = c;

			if (self.ResourceType.configuration.username.value.length && self.ResourceType.configuration.password.value.length){
				client.setSecurity(new WSSecurity(self.ResourceType.configuration.username.value, self.ResourceType.configuration.password.value));
			}
			
			self.ResourceType.waitingQueue.forEach(function(obj){
				obj.handler.apply(self,obj.args);
			});
			
		});
	}
};

function getHandler(resource,req,res){
	if (resource.ResourceType.SOAPClient){
		res.send(200,resource.ResourceType.SOAPClient.describe());
	} else {
		res.send(400,'Cannot describe resource. Either the WSDL URL is incorrect or the external SOAP resource is currently unavailable please check your resource config and that the external SOAP resource is available.');
	}
};

function postHandler(resource,req,res){
    var reqResources = req.url.replace(/\?.*$/,'').split('/'), reqSubResources, i = 0;

    while(reqResources[i] != resource.name && i < reqResources.length){
        i++;
    }

    reqSubResources = reqResources.slice(i+1);

	if (resource.ResourceType.SOAPClient){
		if (reqSubResources.length > 2){
			resource.ResourceType.SOAPClient[reqSubResources[0]][reqSubResources[1]][reqSubResources[2]](req.body, function(err, result) {
				if (err){
					throw err;
				}
				res.send(result);
			});
		} else {
			resource.ResourceType.SOAPClient[reqSubResources[0]](req.body, function(err, result) {
				if (err){
					throw err;
				}
				res.send(result);
			});
		}
	} else {
		res.send(400,'Invalid url, pattern must match ../my-soap-resource/:service/:port/:method or ../my-soap-resource/:method.')
	}
};

exports.ResourceType = {
	name: 'soap',
	label: 'SOAP Proxy',
	configuration: {
		WSDLURL: { inputType: 'text', placeholder:'Enter the url for the REST resource. (ex./ http://myservice/resource)', value: '', required: true },
		username: { inputType: 'text', placeholder:'Enter a username for authentication.', value: '' },
		password: { inputType: 'password', placeholder:'Enter a password for authentication.', value: '' }
	},
	wildcardChildRoute: true,
	GET: function(resource,req,res){
		if (resource.ResourceType.connecting === true){
			resource.ResourceType.waitingQueue.push({
				handler: getHandler,
				args: [resource,req,res]
			});
		} else {
			getHandler(resource,req,res);
		}
	},
	POST: function(resource, req,res){
		if (resource.ResourceType.connecting === true){
			resource.ResourceType.waitingQueue.push({
				handler: postHandler,
				args: [resource,req,res]
			});
		} else {
			postHandler(resource,req,res);
		}
	},
	RESOURCE_CREATE: init,
	RESOURCE_UPDATE: init
};