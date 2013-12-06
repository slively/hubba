"use strict";

/*
	Handler is the same for all verbs.
	It simply checks to see if the route matches the current resource and then returns the list of children on a GET.
	Any route that ends in an area that isn't a get will return a 405 METHOD NOT ALLOWED.
	If the route has more children, then it will resolve the childs route.
*/
var areaHandler = function(resource, req,res){
	/*if (req.params.length){
		var childUrl = req.params[0];
		console.log(childUrl);
		if (childUrl.length && resource.children[childUrl]){
			req.params.shift();
			console.log(resource.children[childUrl].resolve);
			resource.children[childUrl].resolve(req,res);
		} else {
			res.send(404,{message:'area ' + resource.name + ' has no child called ' + childUrl});
		}
	} else*/ 
	if (req.method == "GET") {
		res.send(200,resource.children);
	} else {
		res.send(405);
	}
};

exports.areaHandler = areaHandler;
exports.ResourceType = {
	name: 'area',
	label: 'Area',
	configuration: {},
	GET: areaHandler,
	HEAD: areaHandler,
	POST: areaHandler,
	PUT: areaHandler,
	PATCH: areaHandler,
	DELETE: areaHandler
};