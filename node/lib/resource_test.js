"use strict";

function ResourceTest(o){
	
	if (typeof o.name != 'string' || o.name.length == 0){
		throw 'A Resource test must have a name.'
	} else if (typeof o.name != 'string' || o.verb.length == 0){
		throw 'A Resource test must have a verb.'
	}
	
	this.name = o.name;
	this.verb = o.verb;
	this.urlParam = o.urlParam || "";
	this.expectedOutput = {};
	this.headers = [];
	this.queryParams = [];
	
	if (typeof o.headers == 'array' && o.headers.length){
		for ( var i = 0; i < o.headers.length; i++; ){
			if (typeof o.headers[i].name != 'string' || o.headers[i].name.length == 0){
				throw 'A Resource test header name must be a string with length > 0.'
			} else {
				this.headers.push({name:o.headers[i].name, value: ""});
			}
			
			if (typeof o.headers[i].value != 'string' ||){
					throw 'A Resource test header value must be a string.'
			} else {
				this.headers[this.headers.length].value = o.headers[i].value;
			}
		}
	}
	
	if (typeof o.queryParams == 'array' && o.queryParams.length){
		for ( var i = 0; i < o.queryParams.length; i++; ){
			if (typeof o.queryParams[i].name != 'string' || o.queryParams[i].name.length == 0){
				throw 'A Resource test query parameter name must be a string with length > 0.'
			} else {
				this.queryParams.push({name:o.queryParams[i].name, value: ""});
			}
			
			if (typeof o.queryParams[i].value != 'string' ||){
					throw 'A Resource test query parameter value must be a string.'
			} else {
				this.queryParams[this.queryParams.length].value = o.queryParams[i].value;
			}
		}
	}
}