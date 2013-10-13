var app = angular.module('hubba',['ngRoute']);

app.config(['$routeProvider', '$locationProvider', function($routeProvider, $locationProvider) {
	
	$routeProvider.when('/hubba/', {
		templateUrl: 'http://localhost/hubba/partials/index.html',
		controller: 'indexCtrl'
	}).when('/hubba/resources/', {
		templateUrl: 'http://localhost/hubba/partials/resources.html',
		controller: 'resourceCtrl'
	}).when('/hubba/resources/:resourcesId', {
		templateUrl: 'http://localhost/hubba/partials/resources.html',
		controller: 'resourceCtrl'
	}).when('/hubba/files/', {
	    templateUrl: 'http://localhost/hubba/partials/files.html',
	    controller: 'fileCtrl'
	}).otherwise({templateUrl: 'http://localhost/hubba/partials/404.html'});

  $locationProvider.html5Mode(true);

}]);

app.factory('hubba',['$http','$rootScope', function($http,$rootScope) {
  	//var hubba = $resource('/api/hubba/resources/:id', {id:'@id'}, {'query':  {method:'GET', isArray:false} });
	var hubba = {};

	if ( !Array.prototype.forEach ) {
	  Array.prototype.forEach = function(fn, scope) {
	    for(var i = 0, len = this.length; i < len; ++i) {
	      fn.call(scope, this[i], i, this);
	    }
	  }
	}

	var ef = function(data, status, headers, config){
		hubba.errors.push(data);
	}

	var checkUndefinedFunc = function(f){
		return f || function(){};
	}
	
	hubba.resources = {};
	hubba.resources.cache = {};

	hubba.resources.get = function(o, s, e){
		if (typeof o == "string" || typeof o == "number"){
			$http.get('/api/hubba/resources/'+o).success(checkUndefinedFunc(s)).error(ef).error(checkUndefinedFunc(e));
		} else{
			if (typeof o == "function"){
				e = s;
				s = o;
				$http.get('/api/hubba/resources').success(checkUndefinedFunc(s)).error(ef).error(checkUndefinedFunc(e));
			} else {
				$http.get('/api/hubba/resources',{params:o}).success(checkUndefinedFunc(s)).error(ef).error(checkUndefinedFunc(e));
			}
		}
	};

	hubba.resources.put = function(id, o, s, e){
		$http.put('/api/hubba/resources/'+id,o).success(checkUndefinedFunc(s)).error(ef).error(checkUndefinedFunc(e));
	};

	hubba.resources.post = function(o, s, e){
		$http.post('/api/hubba/resources',o).success(checkUndefinedFunc(s)).error(ef).error(checkUndefinedFunc(e));
	};
	
	hubba.resources.patch = function(o, s, e){
		$http.patch('/api/hubba/resources',o).success(checkUndefinedFunc(s)).error(ef).error(checkUndefinedFunc(e));
	};

	hubba.resources.del = function(id, s, e){
		$http.delete('/api/hubba/resources/'+id).success(checkUndefinedFunc(s)).error(ef).error(checkUndefinedFunc(e));
	};
	
	hubba.resourceTypes = {};
	hubba.resourceTypes.cache = {};
	
	hubba.resourceTypes.get = function(o, s, e){
		if (typeof o == "string" || typeof o == "number"){
			$http.get('/api/hubba/resource_types/'+o).success(checkUndefinedFunc(s)).error(ef).error(checkUndefinedFunc(e));
		} else{
			if (typeof o == "function"){
				e = s;
				s = o;
				$http.get('/api/hubba/resource_types').success(checkUndefinedFunc(s)).error(ef).error(checkUndefinedFunc(e));
			} else {
				$http.get('/api/hubba/resource_types',{params:o}).success(checkUndefinedFunc(s)).error(ef).error(checkUndefinedFunc(e));
			}
		}
	};
	
	hubba.$route = {};
	hubba.$route.path = "";
	hubba.$route.params = {};
	
	$rootScope.$on('$routeChangeSuccess', function(ev,data) {   
		if (data.$$route && data.$$route.originalPath){
       		hubba.$route.path = data.$$route.originalPath;
			hubba.$route.params = data.params;
		}
   	});

	$rootScope.hubba = hubba;

  return hubba;
}]);


app.controller('indexCtrl',['$scope', 'hubba', function($scope, hubba) { 
	
}]);

app.controller('resourceCtrl',['$scope', 'hubba', function($scope, hubba) { 
	if (typeof hubba.selectedResource == 'undefined'){
		hubba.selectedResource = {};
	}
	
	var selectResource = function(id){
		hubba.resources.get(id,function(r){
			hubba.selectedResource = r;
			expandResources(r.parentId,hubba.resources.cache.resourcesRoot);
			$scope.determineResourceUrl(hubba.selectedResource);
		});
	}
	
	if (typeof hubba.resources.cache.resourcesRoot == 'undefined'){
		hubba.resources.get(function(r){
			
			$scope.resourcesRoot = hubba.resources.cache.resourcesRoot = r;

			if (hubba.$route.params.resourcesId){
				selectResource(hubba.$route.params.resourcesId);
			}
		});
		
		hubba.resourceTypes.get(function(r){
			hubba.resourceTypesArray = r;
		});
	} else {
		$scope.resourcesRoot = hubba.resources.cache.resourcesRoot;
		
		if (hubba.$route.params.resourcesId && hubba.$route.params.resourcesId != hubba.selectedResource.id){
			selectResource(hubba.$route.params.resourcesId);
		} else if (!hubba.$route.params.page){
			hubba.selectedResource = {};
			minimizeResources($scope.resourcesRoot);
		}
	}
	
	function findById(id, resource){
		if (typeof resource == 'undefined'){
			resource = hubba.resources.cache.resourcesRoot;
		}
		
		if (resource.id == id){
			return resource;
		} 
		
		if (Object.keys(resource.children).length > 0){
			for (var key in resource.children){
				var t = findById(id,resource.children[key]);
				
				if (t){
					return t;
				}
			};
		}
	}
	
	function updateResource(updatedResource){
		var t = findById(updatedResource.id);
		for ( var key in updatedResource){
			t[key] = updatedResource[key];
		}
	}
	
	function expandResources(parentId,resource){
		if (resource.id == parentId){
			resource.expanded = true;
			return true;
		} else if (Object.keys(resource.children).length == 0){
			return false;
		} else { 
			for (var key in resource.children){
				if (expandResources(parentId,resource.children[key]) == true){
					resource.children[key].expanded = true;
					return true;
				}
			};
		}
	}
	
	function minimizeResources(resource){
		resource.expanded = false;
		for (var key in resource.children){
			minimizeResources(resource.children[key]);
		}
	}
	
	$scope.determineResourceUrl = function(resource, test){
		if (resource.parentId){
			var parentResource = findById(resource.parentId);
			resource.url = '/'+resource.name;
			
			while(typeof parentResource.parentId != 'undefined'){
				resource.url = '/' + parentResource.name + resource.url;
				parentResource = findById(parentResource.parentId);
			}
		
			resource.url =  window.location.protocol + '//' + window.location.hostname + '/' + parentResource.name + resource.url;

			if (test){
				resource.url += '/' + test.urlParam;
				if (test.queryParams.length){
					resource.url += '?';
					for (var i = 0; i < test.queryParams.length; i++){
						if (i > 0){
							resource.url += '&';	
						}
						resource.url += test.queryParams[i].name + '=' + test.queryParams[i].value;
					}
				} 
			}
		}
	}
	
	$scope.saveResource = function(res){
		hubba.resources.put(res.id,res,function(r){
			//updateResource(r);
			res = r;
			hubba.selectedResource = r;
			$scope.determineResourceUrl(hubba.selectedResource);
		});
	};
	
	$scope.hasVerb = function(verb){
		if (hubba.selectedResource.verbs){
			for(var i = 0; i < hubba.selectedResource.verbs.length; i++){
				if (hubba.selectedResource.verbs[i] == verb){
					return true;
				}
			}
		}
		return false;
	};
	
	$scope.tests = [{
		name: "get test #1",
		verb: "GET",
		headers: [{
			"name":"h1",
			"value":"val1"
		},{
			"name":"h2",
			"value":"val2"
		},{
			"name":"h3",
			"value":"val3"
		}],
		urlParam :'123',
		queryParams: [{
			"name":"p1",
			"value":"val1"
		},{
			"name":"p2",
			"value":"val2"
		},{
			"name":"p3",
			"value":"val3"
		}],
		expectedOutput: { 
			"first": {type: "string", required: true},
			"second": {type: "number", required: true},
			"third": {type: "date", required: true},
			"fourth": {type: "boolean", required: true},
			"fifth": ["string"],
			"sixth": ["number"],
			"seventh": ["date"],
			"eigth": ["boolean"],
			"ninth": { 
				type: "object", 
				children: {
					"first": {type: "string", required: true},
					"second": {type: "number", required: true},
					"third": {type: "date", required: true},
					"fourth": {type: "boolean", required: true},
					"fifth": ["string"],
					"sixth": ["number"],
					"seventh": ["date"],
					"eigth": ["boolean"],
					"ninth": { 
						type: "object", 
						required: true, 
						children: {}
					}
				}
			}
		}
	},{
		name: "post test #1",
		verb: "POST",
		urlParam :'',
		queryParams: [{
			"name":"p1",
			"value":"val1"
		},{
			"name":"p2",
			"value":"val2"
		},{
			"name":"p3",
			"value":"val3"
		}],
		body: {
			"b1": "val1",
			"b2": "val2",
			"b3": "val3"
		}
	}];
	
}]);

app.controller('childOutputCtrl',['$scope','hubba',function($scope,hubba){
	
}]);
	
app.controller('childResourceCtrl',['$scope','hubba',function($scope,hubba){
	$scope.addChild = function(parent){
		hubba.resources.post({
			parentId: parent.id,
			name: 'newResource',
			type: 'area',
			verbs: ['GET','POST','PUT','PATCH','DELETE']
		},function(r){
			if (typeof parent.children == 'undefined'){
				parent.children = {};
			}
			parent.children[r.name]=r;
		});
	};
	
	$scope.hasChildren = function(children){
		return Object.keys(children).length;
	}
}]);

app.controller('fileCtrl',['$scope', 'hubba', '$routeParams', function($scope, hubba,$routeParams) { 

}]);

app.controller('body',['$scope', 'hubba', function($scope, hubba) { 
	
}]).directive('hubbaResourceTree',function(){
	return {
		replace: false,
		template: '<ul><li><div class="child"><button class="btn btn-link">/{{resources.name}}</button><br/><button class="btn btn-link" ng-click="resourceAddChild()">Add Child</button></div><ul><li ng-repeat="(key,child) in resources.children"><a href="/hubba/resources/{{child.id}}" ng-click="showChildren = !showChildren;" class="child">/{{child.name}}<span class="glyphicon glyphicon-plus"></span></a><div ng-show="showChildren"><ul hubba-resource-child selected-resource="selectedResource" ng-model="child"></ul></div></li></ul>',
		link: function (scope, element, attrs) {
			scope.showChildren = false;
		}
	};
}).directive('hubbaResourceChild',['$compile',function($compile){
	return {
		replace: false,
		link: function (scope, element, attrs) {
			scope.showChildren = false;
			if (scope.ngModel && scope.ngModel.children && Object.keys(scope.ngModel.children).length) {
				element.append('{{selectedResource.name}}<li ng-repeat="(key,child) in ngModel.children"><a href="/hubba/resources/{{child.id}}" ng-click="showChildren = !showChildren;" class="child">/{{child.name}}</a><div ng-show="showChildren"><ul hubba-resource-child selected-resource="selectedResource" ng-model="child"></ul></div></li>');
				$compile(element.contents())(scope)
			}
		}
	};
}]);