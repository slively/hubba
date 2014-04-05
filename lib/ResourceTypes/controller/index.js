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
    GET: function(resource,req,res,hubba){
        resource.data.GET(req,res,hubba);
    },
    POST: function(resource,req,res,hubba){
        resource.data.POST(req,res,hubba);
    },
    PUT: function(resource,req,res,hubba){
        resource.data.PUT(req,res,hubba);
    },
    PATCH: function(resource,req,res,hubba){
        resource.data.PATCH(req,res,hubba);
    },
    DELETE: function(resource,req,res,hubba){
        resource.data.DELETE(req,res,hubba);
    },
	init: update,
	update:update
};

function update(resource){
    var defaultRes = function(req,res){res.send(405);};
    var evalConfigurationValue = function(val){
        if (val.length){

            try {
                var t = eval("(function(req,res,hubba){var t = undefined;"+val+"});");
            } catch(e) {
                return function(req,res){
                    res.send(500, e);
                };
            }

            // wrap custom function to not allow updating the resource
            return function(req,res,hubba){
                try {
                    t.call(undefined,req,res,hubba);
                } catch(e){
                    res.send(500,e);
                }
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
};