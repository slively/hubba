"use strict";

var nodemailer = require("nodemailer");

var updateTransport = function(resource){
    var opts = {
        host: resource.ResourceType.configuration.host.value, // hostname
        secureConnection: resource.ResourceType.configuration.ssl.value, // use SSL
        port: resource.ResourceType.configuration.port.value // port for secure SMTP
    };

    if (resource.ResourceType.configuration.username.value.length){
        opts.auth = {
            user: resource.ResourceType.configuration.username.value,
            pass: resource.ResourceType.configuration.password.value
        }
        opts.requiresAuth = true;
    }

    resource.ResourceType.transport = nodemailer.createTransport("SMTP",opts);
};

var sendEmail = function(resource, req, res){
    resource.ResourceType.transport.sendMail(req.body, function(err, responseStatus){
        if(err){
            throw err;
        }

        res.send(200,responseStatus.message);
    });
};

exports.ResourceType = {
	name: 'email',
	label: 'Email',
	configuration: {
		host: { inputType: 'text', placeholder:'Enter the email host (ex./ smtp.gmail.com)', value: '', required: true },
		port: { inputType: 'number', placeholder:'Enter a port for the connection.', value: 463 },
		ssl: { inputType: 'checkbox', value: true, header: 'Check to use SSL' },
		username: { inputType: 'text', placeholder:'Enter a username for authentication.', value: '' },
		password: { inputType: 'password', placeholder:'Enter a password for authentication.', value: '' }
	},
    RESOURCE_CREATE: updateTransport,
    RESOURCE_UPDATE: updateTransport,
	POST: sendEmail
};