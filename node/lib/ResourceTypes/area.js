"use strict";

/*
	Core functionality of an area resource is fully encapsulated in the resource class.
	Only returns children on get.
*/

exports.ResourceType = {
	name: 'area',
	label: 'Area',
	configuration: {},
	GET: function(resource, req,res){
        res.send(200,resource.children);
    }
};