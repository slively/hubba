"use strict";

/*
arraySelect: { inputType: 'select', placeholder:'multiple', value: [], options: ['test1', 'test2', 'etc...'], required: true, multiple: true },
select: { inputType: 'select', placeholder:'multiple', value: [], options: ['test1', 'test2', 'etc...'], required: true },
radio: { inputType: 'radio', value: 'test1', options: ['test1', 'test2', 'etc...'], required: true, header: 'Radios Woo!' },
check: { inputType: 'checkbox', value:true, header: 'Checkbox Woo!' }
*/

var request = require('request');

exports.ResourceType = {
	name: 'rest',
	label: 'REST Proxy',
	configuration: {
		url: { inputType: 'text', placeholder:'Enter the url for the REST resource. (ex./ http://myservice/resource)', value: '', required: true },
		params: {inputType: 'text', placeholder:'Enter query params that will always be sent. (ex./param1=a)', value: '' }
	},
	GET: function(resource,req,res){
		request.get(resource.configuration.url+'?'+resource.configuration.params).pipe(res)
	},
	HEAD: function(){
		request.head(resource.configuration.url+'?'+resource.configuration.params).pipe(res)
	},
	POST: function(){
		request.post(resource.configuration.url+'?'+resource.configuration.params,req.body).pipe(res)
	},
	PUT: function(){
		request.put(resource.configuration.url+'?'+resource.configuration.params,req.body).pipe(res)
	},
	PATCH: function(){
		request.patch(resource.configuration.url+'?'+resource.configuration.params,req.body).pipe(res)
	},
	DELETE: function(){
		request.del(resource.configuration.url+'?'+resource.configuration.params).pipe(res)
	}
};