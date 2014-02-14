"use strict";

var soap = require('soap');

function init(resource){
	var self = this;

	if (resource.configuration.WSDLURL.length){
		
		if (resource.data.SOAPClient){
			delete resource.data.SOAPClient;
		}

        resource.data.connecting = true;
        resource.data.waitingQueue = [];
		
		soap.createClient(resource.configuration.WSDLURL, function(err, c) {

            resource.data.connecting = false;
			
			if (err){
				throw err;
				return;
			}

            resource.data.SOAPClient = c;

			if (resource.configuration.username.length && resource.configuration.password.length){
				client.setSecurity(new WSSecurity(resource.configuration.username, resource.configuration.password));
			}

            resource.data.waitingQueue.forEach(function(obj){
				obj.handler.apply(self,obj.args);
			});
			
		});
	}
};

function getHandler(resource,req,res){
	if (resource.data.SOAPClient){
		res.send(200,resource.data.SOAPClient.describe());
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

	if (resource.data.SOAPClient){
		if (reqSubResources.length > 2){
			resource.data.SOAPClient[reqSubResources[0]][reqSubResources[1]][reqSubResources[2]](req.body, function(err, result) {
				if (err){
					throw err;
				}
				res.send(result);
			});
		} else {
			resource.data.SOAPClient[reqSubResources[0]](req.body, function(err, result) {
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
		WSDLURL: { inputType: 'text', placeholder:'Enter the url for the SOAP WSDL. (ex./ http://myservice.com/soap/WSDL?WSDL)', value: '', required: true },
		username: { inputType: 'text', placeholder:'Enter a username for authentication.', value: '' },
		password: { inputType: 'password', placeholder:'Enter a password for authentication.', value: '' }
	},
	wildcardRoute: true,
	GET: function(resource,req,res){
		if (resource.data.connecting === true){
			resource.data.waitingQueue.push({
				handler: getHandler,
				args: [resource,req,res]
			});
		} else {
			getHandler(resource,req,res);
		}
	},
	POST: function(resource, req,res){
		if (resource.data.connecting === true){
			resource.data.waitingQueue.push({
				handler: postHandler,
				args: [resource,req,res]
			});
		} else {
			postHandler(resource,req,res);
		}
	},
	init: init,
	update: init
};