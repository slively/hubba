"use strict";


// returns possible verbs for resource
function checkVerbs(resource){
	var verbs = [];
	
	if (resource.type == 'area'){
		return ['get','post','put','del','head'];
	} 
	
	if (resource.config && resource.config.verbs){
		
		if (resource.config.verbs.length == 0){
			return ['get','post','put','del','head'];
		}
		
		if (resource.config.verbs.indexOf('GET')){
			verbs.push('get');
		}
	
		if (resource.config.verbs.indexOf('POST')){
			verbs.push('post');
		}
	
		if (resource.config.verbs.indexOf('PUT')){
			verbs.push('put');
		}
	
		if (resource.config.verbs.indexOf('DELETE')){
			verbs.push('del');
		}
	
		if (resource.config.verbs.indexOf('HEAD')){
			verbs.push('head');
		}
	}
	
	return verbs;
};


function traverseConfig(server, c){
	var verbs = [];
	
	for (var key in c){
		
		console.log(c[key]);
		console.log(checkVerbs(c[key]));
		verbs = checkVerbs(c[key]);
		
		for (var j in verbs){
			server[verbs[j]]('/'+key,function send(req, res, next) {
			   res.send('hello ' + req);
			   return next();
			 });
		}
	}
};

var root;

exports.registerRoutes = function(server, r){
	/*server.get('/',function send(req, res, next) {
	   res.end('hello ' + req.params.name);
	});
	
	traverseConfig(server, root);
	//console.log(server);*/
	root = r;
	
	server.use(function (req, res, next){
		var p = req.path(), q = req.query(), pa = p.split('/'), t = r;
		
		console.log(p);
		console.log(q);
		console.log(pa);
		
		for ( var i = 1; i < pa.length; i++ ){
			if (typeof t.children[pa[i]] != undefined){
				t = t.children[pa[i]];
				break;
			}
		}
		console.log(t);
		t.handlers.get(req, res);
		
		//res.send('hello!');
		return next();
	});
};
