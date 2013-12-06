var restify = require('restify'), server, resource, resourceType;

var startup = function (opts){
	var opts = opts || {};
	
	resource = require('../lib/resource');
	resourceType = require('../lib/resource_type');
	
	var port = opts.port || 8080;	
	server = restify.createServer();
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

	server.get('/hubba/api/resources',function(req,res){
		res.send(200,root.toJson({includeChildren:true}));
	});

	server.get('/hubba/api/resources/:id',function(req,res){
		try {
			res.send(200,resource.findById(req.params.id).toJson({includeChildren: req.query.include_children === 'true'}));
		} catch(e){
            console.log(e.stack);

			var c = 404 || e.code;
			res.send(c,e.message);
		}
	});

	server.put('/hubba/api/resources/:id',function(req,res){
		try{
			res.send(200,resource.findById(req.params.id).update(req.body).toJson({includeChildren: req.query.include_children === 'true'}));
		} catch(e){
            console.log(e.stack);

			var c = 400 || e.code;
			res.send(c,e.message);
		}
	});

	server.patch('/hubba/api/resources/:id',function(req,res){
		try{
			res.send(200,resource.findById(req.params.id).update(req.body).toJson({includeChildren: req.query.include_children === 'true'}));
		} catch(e){
            console.log(e.stack);

			var c = 400 || e.code;
			res.send(c,e.message);
		}
	});

	server.post('/hubba/api/resources',function(req,res){
		try {
			res.send(200,resource.findById(req.body.parentId).addChild(req.body).toJson({includeChildren:true}));
		} catch(e){
            console.log(e.stack);

			var c = 400 || e.code, m;
			if (e.message){
				m = e.message;
			} else {
				m = e
			}
			res.send(c,m);
		}
	});

	server.del('/hubba/api/resources/:id',function(req,res){
		try {
			resource.findById(req.params.id).del();
			res.send(200);
		} catch(e){
			var c = 404 || e.code;
			res.send(c,e.message);
		}
	});

	server.get('/hubba/api/resource_types/',function(req,res){
		res.send(resourceType.getResourceTypes());
	});

	resource.registerServer(server);
	root = resource.generateResources();

	server.listen(port);
    console.log("Hubba listening on port: " + port);
	return server;
};



var shutdown = function(){
	server.close();
};

exports.startup = startup;
exports.shutdown = shutdown;