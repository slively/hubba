"use strict";

/*
	Controllers are special from a UI perspective and get a special tabbed interface, 
	along with the ability to create / run tests.
	
	TODO: Currently the node.js VM module is slow to execute so this is using EVAL.
			There are risks that the custom code could cause unintended consequences.
			For now we will trust that developers and further discuss how
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
	RESOURCE_CREATE: function(){
		var defaultRes = function(resource,req,res){res.send(405);};
		
		this.ResourceType.GET = defaultRes;		
		this.ResourceType.POST = defaultRes; 
		this.ResourceType.PUT = defaultRes; 
		this.ResourceType.PATCH = defaultRes; 
		this.ResourceType.DELETE = defaultRes; 
	},
	RESOURCE_UPDATE: function(){
		var defaultRes = function(resource,req,res){res.send(405);};
		var evalConfigurationValue = function(val){
			if (val.length){
				var t = eval("(function(req,res){var t = undefined;"+val.replace(/\\/g,"")+"});");

				// wrap custom function to not allow updating the resource
				return function(resource,req,res){
					var resource = undefined;
					t.call(undefined,req,res);
				}
			}

			return defaultRes;
		};
		
		this.ResourceType.GET = evalConfigurationValue(this.ResourceType.configuration.get.value);		
		this.ResourceType.POST = evalConfigurationValue(this.ResourceType.configuration.post.value);
		this.ResourceType.PUT = evalConfigurationValue(this.ResourceType.configuration.put.value);
		this.ResourceType.PATCH = evalConfigurationValue(this.ResourceType.configuration.patch.value);
		this.ResourceType.DELETE = evalConfigurationValue(this.ResourceType.configuration.del.value);
		
		/// set to undefined so controller code can't access
		defaultRes = evalConfigurationValue = undefined;
	}
};