"use strict";

/*
arraySelect: { inputType: 'select', placeholder:'multiple', value: [], options: ['test1', 'test2', 'etc...'], required: true, multiple: true },
select: { inputType: 'select', placeholder:'single', value: '', options: ['test1', 'test2', 'etc...'], required: true },
radio: { inputType: 'radio', value: 'test1', options: ['test1', 'test2', 'etc...'], required: true, header: 'Radios Woo!' },
check: { inputType: 'checkbox', value:true, header: 'Checkbox Woo!' }
*/

var request = require('request');

exports.ResourceType = {
	name: 'odbc',
	label: 'ODBC Connector',
	config: {
		driver: { inputType: 'select', placeholder:'Select a database driver', value: '', options: ['MySQL', 'Postgresql', 'Microsoft SQL Server', 'Oracle', 'DB2', 'SQLite', 'Microsoft Access'], required: true }, 
		connection_string: { inputType: 'text', placeholder:'Enter the url for the REST resource. (ex./ http://myservice/resource)', value: 'p1=abc&p2=123', required: true },
		username: { inputType: 'text', placeholder:'Enter a username for authentication.', value: '' },
		password: { inputType: 'password', placeholder:'Enter a password for authentication.', value: '' }
	},
	GET: function(resource,req,res){
		request.get(resource.ResourceType.config.url.value+'?'+resource.ResourceType.config.params.value).pipe(res)
	},
	HEAD: function(){
		request.head(resource.ResourceType.config.url.value+'?'+resource.ResourceType.config.params.value).pipe(res)
	},
	POST: function(){
		request.post(resource.ResourceType.config.url.value+'?'+resource.ResourceType.config.params.value,req.body).pipe(res)
	},
	PUT: function(){
		request.put(resource.ResourceType.config.url.value+'?'+resource.ResourceType.config.params.value,req.body).pipe(res)
	},
	PATCH: function(){
		request.patch(resource.ResourceType.config.url.value+'?'+resource.ResourceType.config.params.value,req.body).pipe(res)
	},
	DELETE: function(){
		request.del(resource.ResourceType.config.url.value+'?'+resource.ResourceType.config.params.value).pipe(res)
	}
};