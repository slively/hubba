"use strict";

var request = require('request'),
    qs = require('querystring'),
    zlib = require('zlib');;


function onUpdate(resource, event){
    resource.data.query = qs.parse(resource.configuration.params);
    resource.data.headers = {};
    if (resource.configuration.headers.length) {
        resource.configuration.headers.split('\n').forEach(function(h){
            var t = h.split(':');
            if (t.length == 1 || t.length == 2 && t[0].length){
                resource.data.headers[t[0].trim()] = (t[1] || '').trim();
            } else {
                throw 'Headers are not defined properly.';
            }
        });
    }
};

function handler(resource,req,res){
    var u = resource.configuration.url,
        q = {},
        h = {},
        b;

    if (resource.configuration.fwdUrl === true){
        u += req.path.replace(resource.path.replace('*',''),'');
    } else if (req.path.replace(resource.path.replace('*',''),'').length > 0) {
        res.send(404,'URL forwarding is not allowed on this resource, only the following url will work: '+resource.path.replace('*',''));
    }

    if (resource.configuration.fwdQuery === true){
        q = req.query;
    }

    if (resource.configuration.fwdBody === true){
        b = req.body;
    }

    if (resource.configuration.fwdHeaders === true){
        h = req.headers;
        delete h.host;
    }

    // Override forwarded data with hard-coded data in configuration
    for ( var k in resource.data.query ) { q[k] = resource.data.query[k]; }
    for ( var k2 in resource.data.headers ) { h[k2] = resource.data.headers[k2]; }

    var o = {
        method: req.method,
        url: u,
        qs: q,
        headers: h
    };

    if ( typeof b === 'object'){
        if (req.accepts('json')){
            o.json = b;
        } else {
            o.body = JSON.stringify(b);
        }
    }

    request(o).on('response', function (resp) {
        // check if error thrown and response already sent.
        if (res.headersSent){
            return;
        }

        res.header('Content-Type',resp.headers['content-type']);
        if (resp.headers && resp.headers['content-encoding'] && resp.headers['content-encoding'].indexOf('gzip') !== -1) resp.pipe(zlib.createGunzip()).pipe(res)
        else resp.pipe(res)
    });
};

exports.ResourceType = {
	name: 'rest',
	label: 'REST Proxy',
	configuration: {
		url: { inputType: 'text', placeholder:'Enter the url for the REST resource. (ex./ http://myservice/resource)', value: '', required: true },
		params: {inputType: 'text', placeholder:'Enter query params that will always be sent. (ex./ param1=a&param2=b....)', value: '' },
        headers: {inputType: 'textarea', placeholder:'Enter headers that will always be sent. (ex./ content-type: application/json ...', value: '' },
        fwdUrl: { inputType: 'checkbox', value:true, header: 'Forward url parameters (will be appended to the end of the url)' },
        fwdQuery: { inputType: 'checkbox', value:true, header: 'Forward query parameters (hard-coded query string will take precedence)' },
        fwdBody: { inputType: 'checkbox', value:true, header: 'Forward body' },
        fwdHeaders: { inputType: 'checkbox', value:true, header: 'Forward headers' }
	},
    wildcardRoute: true,
    init: onUpdate,
    update: onUpdate,
	GET: handler,
	POST: handler,
	PUT: handler,
	PATCH: handler,
	DELETE: handler
};