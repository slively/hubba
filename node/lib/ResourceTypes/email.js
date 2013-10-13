"use strict";

var nodemailer = require("nodemailer");

/*
	Handler is the same for all verbs.
	It simply checks to see if the route matches the current resource and then returns the list of children on a GET.
	Any route that ends in an area that isn't a get will return a 405 METHOD NOT ALLOWED.
	If the route has more children, then it will resolve the childs route.
*/

var createTransport = function(resource){
	
};

var updateTransport = function(resource){
	
};

var closeTransport = function(resource){
	
};


var sendEmail = function(resource, req, res){
	if (req.params.length){
		var childUrl = req.params[0];
		if (childUrl.length && resource.children[childUrl]){
			req.params.shift();
			resource.children[childUrl].resolve(req,res);
		} else {
			res.send(404,{message:'area ' +resource.name+ ' has no child called ' + childUrl});
		}
	} else if (req.method == "GET") {
		res.send(200,resource.children);
	} else {
		res.send(405);
	}
};

exports.ResourceType = {
	name: 'email',
	label: 'Email',
	config: {
		host: { inputType: 'text', placeholder:'Enter the email host (ex./ smtp.gmail.com)', value: '', required: true },
		port: { inputType: 'number', placeholder:'Enter a port for the connection.', value: 463 },
		ssl: { inputType: 'checkbox', value: true, header: 'Check to use SSL' },
		username: { inputType: 'text', placeholder:'Enter a username for authentication.', value: '' },
		password: { inputType: 'password', placeholder:'Enter a password for authentication.', value: '' }
	},
	POST: sendEmail,
};