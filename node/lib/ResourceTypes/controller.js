"use strict";

/*
	Controllers are special from a UI perspective and get a special tabbed interface, 
	along with the ability to create / run tests.
	
	TODO: Currently the node.js VM module is slow to execute so this is using EVAL.
			There are risks that the custom code could cause unintended consequences.
			For now we will trust developers and further discuss how
			developers can be prevented from shooting themselves in the foot without
			taking a big performance hit.
*/


exports.ResourceType = {
	name: 'controller',
	label: 'Controller',
	configuration: {
		get: { inputType: 'text', value: "" },
		post: { inputType: 'text', value: "" },
		put: { inputType: 'text', value: "" },
		patch: { inputType: 'text', value: "" },
		del: { inputType: 'text', value: "" }
	},
    GET: function(resource,req,res){
        resource.data.GET(req,res);
    },
    POST: function(resource,req,res){
        resource.data.POST(req,res);
    },
    PUT: function(resource,req,res){
        resource.data.PUT(req,res);
    },
    PATCH: function(resource,req,res){
        resource.data.PATCH(req,res);
    },
    DELETE: function(resource,req,res){
        resource.data.DELETE(req,res);
    },
	init: function(resource){
		var defaultRes = function(resource,req,res){res.send(405);};

        resource.data.GET = defaultRes;
        resource.data.POST = defaultRes;
        resource.data.PUT = defaultRes;
        resource.data.PATCH = defaultRes;
        resource.data.DELETE = defaultRes;
	},
	update: function(resource){
		var defaultRes = function(resource,req,res){res.send(405);};
		var evalConfigurationValue = function(val){
			if (val.length){
				var t = eval("(function(req,res){var t = undefined;"+val.replace(/\\/g,"")+"});");

				// wrap custom function to not allow updating the resource
				return function(req,res){
					t.call(undefined,req,res);
				}
			}

			return defaultRes;
		};

        resource.data.GET = evalConfigurationValue(resource.configuration.get);
        resource.data.POST = evalConfigurationValue(resource.configuration.post);
        resource.data.PUT = evalConfigurationValue(resource.configuration.put);
        resource.data.PATCH = evalConfigurationValue(resource.configuration.patch);
        resource.data.DELETE = evalConfigurationValue(resource.configuration.del);
		
		/// set to undefined so controller code can't access
		defaultRes = evalConfigurationValue = undefined;
	}
};