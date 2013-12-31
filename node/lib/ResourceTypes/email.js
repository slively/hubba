"use strict";

var nodemailer = require("nodemailer");

var updateTransport = function(resource){
    var opts = {
        host: resource.configuration.host, // hostname
        secureConnection: resource.configuration.ssl, // use SSL
        port: resource.configuration.port // port for secure SMTP
    };

    if (resource.configuration.username.length){
        opts.auth = {
            user: resource.configuration.username,
            pass: resource.configuration.password
        }
        opts.requiresAuth = true;
    }

    delete resource.data.transport;

    if (opts.host.length){
        resource.data.transport = nodemailer.createTransport("SMTP",opts);
    }
};

var sendEmail = function(resource, req, res){

    if(resource.data.transport){
        resource.data.transport.sendMail(req.body, function(err, responseStatus){
            if(err){
                console.log(err.stack);
                throw err;
            }
            res.send(200,responseStatus.message);
        });
    } else {
        throw new Error('Must define a host before attempting to send emails.')
    }
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
    init: updateTransport,
    update: updateTransport,
	POST: sendEmail
};