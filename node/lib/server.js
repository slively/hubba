//require('./routing').registerRoutes(server, root);

var p = 8080;
var restify = require('restify'),
	server = restify.createServer(),
	resource = require('../lib/resource'); // todo: pull from config

var root = resource.generateResources();
var resourceType = require('../lib/resource_type');


server.use(restify.acceptParser(server.acceptable));
server.use(restify.authorizationParser());
server.use(restify.dateParser());
server.use(restify.queryParser());
server.use(restify.jsonp());
server.use(restify.gzipResponse());
server.use(restify.bodyParser());

/*server.use(restify.throttle({
  burst: 100,
  rate: 50,
  ip: true,
  overrides: {
    '192.168.1.1': {
      rate: 0,        // unlimited
      burst: 0
    }
  }
}));
server.use(restify.conditionalRequest());*/

server.get('/api/hubba/resources',function(req,res){
	res.send(200,root.toJson({includeChildren:true}));
});

server.get('/api/hubba/resources/:id',function(req,res){
	res.send(200,resource.findById(req.params.id).toJson({includeChildren: req.query.include_children === 'true'}));
});

server.put('/api/hubba/resources/:id',function(req,res){
	res.send(200,resource.findById(req.params.id).update(req.body).toJson());
});

server.patch('/api/hubba/resources/:id',function(req,res){
	res.send(200,resource.findById(req.params.id).update(req.body).toJson());
});

server.post('/api/hubba/resources',function(req,res){
	res.send(200,resource.findById(req.body.parentId).addChild(req.body).toJson({includeChildren:true}));
});

server.del('/api/hubba/resources/:id',function(req,res){
	resource.findById(req.params.id).del();
	res.send(200);
});

server.get('/api/hubba/resource_types/',function(req,res){
	res.send(resourceType.getResourceTypes());
});

var resourceHandler = function(req, res){
	if (req.params[0] != root.name){
		res.send(404, "Root api name is " + root.name + ". Try /" +root.name+ "/..." )
	} else {
		req.params = req.params[1].split("/");
		if (req.params.length && req.params[0].length == 0){
			req.params = [];
		}
		root.resolve(req,res)
		//res.send(200,req.params[1].split("/"));
/*		var p = req.params[1].split("/");
		var r = p[0];
		
		if (root.children[r]){
			req.params = p.shift();
			root.children[r].resolve(req, res);
		} else {
			res.send(404);
		}*/
		
	}
}

/* configured resources /api/... /^\/api\/([a-zA-Z0-9_\.~-]+)\/?(.*)/ */
server.get(/^\/([a-zA-Z0-9_\.~-]+)\/(.*)/,function(req,res){
	resourceHandler(req,res);
});

server.put(/^\/([a-zA-Z0-9_\.~-]+)\/(.*)/,function(req,res){
	resourceHandler(req,res);
});

server.patch(/^\/([a-zA-Z0-9_\.~-]+)\/(.*)/,function(req,res){
	resourceHandler(req,res);
});

server.post(/^\/([a-zA-Z0-9_\.~-]+)\/(.*)/,function(req,res){
	resourceHandler(req,res);
});

server.del(/^\/([a-zA-Z0-9_\.~-]+)\/(.*)/,function(req,res){
	resourceHandler(req,res);
});

server.head(/^\/([a-zA-Z0-9_\.~-]+)\/(.*)/,function(req,res){
	resourceHandler(req,res);
});


server.listen(p);