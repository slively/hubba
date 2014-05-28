var app = angular.module('hubba',['ngRoute', 'ui.ace', 'ng-context-menu', 'ui.sortable']);

app.config(['$routeProvider', '$locationProvider', function($routeProvider, $locationProvider) {

    var servicesRoute = { templateUrl: '/hubba-admin/partials/services.html', controller: 'serviceCtrl' },
        socketsRoute = { templateUrl: '/hubba-admin/partials/sockets.html', controller: 'socketCtrl' },
        filesRoute = { templateUrl: '/hubba-admin/partials/files.html', controller: 'fileCtrl' },
        helpRoute = { templateUrl: '/hubba-admin/partials/help.html', controller: 'helpCtrl' },
        authenticatorsRoute = { templateUrl: '/hubba-admin/partials/authenticators.html', controller: 'authenticatorCtrl' }
        logRoute = {templateUrl: '/hubba-admin/partials/logs.html', controller: 'logCtrl' };

    $routeProvider
        .when('/hubba-admin/', { templateUrl: '/hubba-admin/partials/index.html', controller: 'indexCtrl' })
        .when('/hubba-admin/services/', servicesRoute)
        .when('/hubba-admin/services/:id', servicesRoute)
        .when('/hubba-admin/sockets/',socketsRoute)
        .when('/hubba-admin/sockets/:name', socketsRoute)
        .when('/hubba-admin/files/', filesRoute)
        .when('/hubba-admin/files/:id', filesRoute)
        .when('/hubba-admin/authenticators', authenticatorsRoute)
        .when('/hubba-admin/authenticators/:id', authenticatorsRoute)
        .when('/hubba-admin/help', helpRoute)
        .when('/hubba-admin/help/:doc', helpRoute)
        .when('/hubba-admin/logs', logRoute)
        .when('/hubba-admin/map', {templateUrl: '/hubba-admin/partials/map.html', controller: 'mapCtrl' })
        .otherwise({templateUrl: '/hubba-admin/partials/404.html'});

    $locationProvider.html5Mode(true);

}]);

app.factory('hubba',['$http','$rootScope','$location', function($http,$rootScope,$location) {
    var hubba = {};

    if ( !Array.prototype.forEach ) {
        Array.prototype.forEach = function(fn, scope) {
            for(var i = 0, len = this.length; i < len; ++i) {
                fn.call(scope, this[i], i, this);
            }
        }
    }

    hubba.errors = [];

    var ef = function(data, status, headers, config){
        hubba.errors.push(data);
    };

    var checkUndefinedFunc = function(f){
        return f || function(){};
    };


    /**
     * Me
     */

    hubba.authenticated = null; // null == nothing has happened
    hubba.me = null; // as documentation
    hubba.login = function(o) {
        hubba.authenticated = 'loading';
        return $http.post('/hubba/api/login',o).success(function(me){
            hubba.authenticated = true;
            hubba.me = me;
        }).error(function(){
            hubba.authenticated = false;
        });
    }
    hubba.logout = function(o) {
        return $http.post('/hubba/api/logout',o).success(function(){
            hubba.authenticated = false;
        }).error(ef);
    }

    $http.get('/hubba/api/me').success(function(me){
        hubba.me = me;
        hubba.authenticated = true;
        $location.path(hubba._redirectAfterAuth);
    }).error(function(){
        hubba.authenticated = false;
    });


    /**
     * Users
     */

    hubba.users = {};
    hubba.users.cache = [];

    // TODO: Users config page

    /**
     * Services
     */

    hubba.services = {};
    hubba.services.cache = [];
    hubba.services.hasFetched = false;

    function refreshServicesCache(serviceTypes) {
        hubba.services.cache = serviceTypes;
        hubba.services.hasFetched = true;
    }

    hubba.services.get = function(o, s, e){
        if (typeof o == "string" || typeof o == "number"){
            return $http.get('/hubba/api/services/'+o).success(refreshServicesCache).success(checkUndefinedFunc(s)).error(ef).error(checkUndefinedFunc(e));
        } else{
            if (typeof o == "function"){
                e = s;
                s = o;
                return $http.get('/hubba/api/services').success(refreshServicesCache).success(checkUndefinedFunc(s)).error(ef).error(checkUndefinedFunc(e));
            } else {
                return $http.get('/hubba/api/services',{params:o}).success(refreshServicesCache).success(checkUndefinedFunc(s)).error(ef).error(checkUndefinedFunc(e));
            }
        }
    };

    hubba.services.put = function(id, o, s, e){
        return $http.put('/hubba/api/services/'+id,o).success(checkUndefinedFunc(s)).error(ef).error(checkUndefinedFunc(e));
    };

    hubba.services.post = function(o, s, e){
        return $http.post('/hubba/api/services',o).success(function(s){hubba.services.cache.push(s);}).success(checkUndefinedFunc(s)).error(ef).error(checkUndefinedFunc(e));
    };

    hubba.services.patch = function(id, o, s, e){
        return $http.patch('/hubba/api/services'+id,o).success(checkUndefinedFunc(s)).error(ef).error(checkUndefinedFunc(e));
    };

    hubba.services.del = function (id, s, e){
        return $http.delete('/hubba/api/services/'+id).success(checkUndefinedFunc(s)).success(function removeFromCache(){
            _.remove(hubba.services.cache, { id: id });
            if (hubba.selectedService.id === id) {
                delete hubba.selectedService;
                $location.search('');
                $location.path('/hubba-admin/services/');
            }
        }).error(ef).error(checkUndefinedFunc(e));
    };



    /**
    *   Service Adapters (TODO: need to do some renaming)
     */

    hubba.serviceTypes = {};
    hubba.serviceTypes.cache = {};
    hubba.serviceTypes.hasFetched = false;

    function refreshServiceTypesCache(serviceTypes) {
        hubba.serviceTypes.cache = serviceTypes;
        hubba.serviceTypes.hasFetched = true;
    }

    hubba.serviceTypes.get = function(o, s, e){
        if (typeof o == "string" || typeof o == "number"){
            return $http.get('/hubba/api/service_types/'+o).success(checkUndefinedFunc(s)).error(ef).error(checkUndefinedFunc(e));
        } else{
            if (typeof o == "function" || typeof o == "undefined"){
                e = s;
                s = o;
                return $http.get('/hubba/api/service_types?object=true').success(refreshServiceTypesCache).success(checkUndefinedFunc(s)).error(ef).error(checkUndefinedFunc(e));
            } else {
                return $http.get('/hubba/api/service_types?object=true',{params:o}).success(refreshServiceTypesCache).success(checkUndefinedFunc(s)).error(ef).error(checkUndefinedFunc(e));
            }
        }
    };



    /**
    *   Sockets
    **/

    hubba.sockets = {};
    hubba.sockets.cache = [];
    hubba.sockets.hasFetched = false;

    function refreshSocketsCache(sockets) {
        hubba.sockets.cache = sockets;
        hubba.sockets.hasFetched = true;
    }

    hubba.sockets.get = function(o, s, e){
        if (typeof o == "string" || typeof o == "number"){
            return $http.get('/hubba/api/sockets/'+o).success(checkUndefinedFunc(s)).error(ef).error(checkUndefinedFunc(e));
        } else {
            if (typeof o == "function"){
                e = s;
                s = o;
                return $http.get('/hubba/api/sockets').success(refreshSocketsCache).success(checkUndefinedFunc(s)).error(ef).error(checkUndefinedFunc(e));
            } else {
                return $http.get('/hubba/api/sockets',{params:o}).success(refreshSocketsCache).success(checkUndefinedFunc(s)).error(ef).error(checkUndefinedFunc(e));
            }
        }
    };
    hubba.sockets.put = function(o, s, e) {
        return $http.put('/hubba/api/sockets/'+ o.id,o).success(checkUndefinedFunc(s)).error(ef).error(checkUndefinedFunc(e));
    };
    hubba.sockets.post = function(o, s, e){
        return $http.post('/hubba/api/sockets',o).success(checkUndefinedFunc(s)).error(ef).error(checkUndefinedFunc(e));
    };

    hubba.sockets.patch = function(o, s, e){
        return $http.patch('/hubba/api/sockets/'+ o.id,o).success(checkUndefinedFunc(s)).error(ef).error(checkUndefinedFunc(e));
    };
    hubba.sockets.del = function (socket, s, e){
        return $http.delete('/hubba/api/sockets/'+socket.id).success(checkUndefinedFunc(s)).success(function(){
            $location.path('/hubba-admin/sockets').search({});
        }).error(ef).error(checkUndefinedFunc(e));
    };



    /**
     *  Files
     **/

    hubba.files = {};
    hubba.files.cache = {};
    hubba.files.hasFetched = false;

    function refreshFilesCache(filesTree) {
        hubba.files.cache = filesTree;
        hubba.files.hasFetched = true;
    }

    function addFileToCacheDef(file) {
        var cur,
            parts = file.path.split('/');

        for ( var i in parts ) {
            if (cur){
                if (cur[parts[i]]) {
                    cur = cur[parts[i]];
                } else {
                    cur[parts[i]] = file;
                }
            } else {
                cur = hubba.files.cache;
            }
        }
    }

    function updateSelectedFile(file) {
        if (hubba.selectedFile && hubba.selectedFile.id === file.id) {
            hubba.selectedFile = file;
        }
    }

    hubba.files.get = function(o, s, e){
        if (typeof o == "string" || typeof o == "number"){
            return $http.get('/hubba/api/files/'+o).success(checkUndefinedFunc(s)).error(ef).error(checkUndefinedFunc(e));
        } else {
            if (typeof o == "function"){
                e = s;
                s = o;
                return $http.get('/hubba/api/files?tree=true').success(refreshFilesCache).success(checkUndefinedFunc(s)).error(ef).error(checkUndefinedFunc(e));
            } else {
                return $http.get('/hubba/api/files?tree=true',{params:o}).success(refreshFilesCache).success(checkUndefinedFunc(s)).error(ef).error(checkUndefinedFunc(e));
            }
        }
    };
    hubba.files.put = function(o, s, e) {
        return $http.put('/hubba/api/files/'+ o.id,o).success(updateSelectedFile).success(checkUndefinedFunc(s)).error(ef).error(checkUndefinedFunc(e));
    };
    hubba.files.patch = function(o, s, e){
        return $http.patch('/hubba/api/files/'+ o.id,o).success(updateSelectedFile).success(addFileToCacheDef).success(checkUndefinedFunc(s)).error(ef).error(checkUndefinedFunc(e));
    };
    hubba.files.post = function(o, s, e){
        return $http.post('/hubba/api/files',o).success(addFileToCacheDef).success(checkUndefinedFunc(s)).error(ef).error(checkUndefinedFunc(e));
    };
    hubba.files.del = function (id, s, e){
        return $http.delete('/hubba/api/files/'+id).success(checkUndefinedFunc(s)).error(ef).error(checkUndefinedFunc(e));
    };

    hubba.files.renameFolder = function renameFolderDef(obj) {
        return $http.put('/hubba/api/files/renameFolder',obj).success(refreshFilesCache).success(checkUndefinedFunc(s)).error(ef).error(checkUndefinedFunc(e));
    };

    hubba.files.removeFolder = function removeFolderDef(folder) {
        return $http.put('/hubba/api/files/removeFolder',{path:folder.path}).success(function removeFolderFromCache(cur){

            if (typeof cur !== 'object') {
                cur = hubba.files.cache;
            }

            for ( var key in cur ) {
                if (typeof cur[key] === 'object') {
                    if (cur[key].path === folder.path) {
                        cur[key] = undefined;
                    } else {
                        removeFolderFromCache(cur[key])
                    }
                }
            }

        }).error(ef);
    };



    /**
     *  Authenticators
     **/

    hubba.authenticators = {};
    hubba.authenticators.cache = [];
    hubba.authenticators.hasFetched = false;

    function refreshAuthenticatorsCache(authenticatorsList) {
        hubba.authenticators.cache = authenticatorsList;
        hubba.authenticators.hasFetched = true;
    }

    function addAuthStrategyToCache(a) {
       hubba.authenticators.cache.push(a);
    }

    hubba.authenticators.get = function(o, s, e){
        if (typeof o == "string" || typeof o == "number"){
            return $http.get('/hubba/api/authenticators/'+o).success(checkUndefinedFunc(s)).error(ef).error(checkUndefinedFunc(e));
        } else {
            if (typeof o == "function"){
                e = s;
                s = o;
                return $http.get('/hubba/api/authenticators').success(refreshAuthenticatorsCache).success(checkUndefinedFunc(s)).error(ef).error(checkUndefinedFunc(e));
            } else {
                return $http.get('/hubba/api/authenticators',{params:o}).success(refreshAuthenticatorsCache).success(checkUndefinedFunc(s)).error(ef).error(checkUndefinedFunc(e));
            }
        }
    };
    hubba.authenticators.put = function(o, s, e) {
        return $http.put('/hubba/api/authenticators/'+ o.id,o).success(checkUndefinedFunc(s)).error(ef).error(checkUndefinedFunc(e));
    };
    hubba.authenticators.patch = function(o, s, e){
        return $http.patch('/hubba/api/authenticators/'+ o.id,o).success(checkUndefinedFunc(s)).error(ef).error(checkUndefinedFunc(e));
    };
    hubba.authenticators.post = function(o, s, e){
        return $http.post('/hubba/api/authenticators',o).success(addAuthStrategyToCache).success(checkUndefinedFunc(s)).error(ef).error(checkUndefinedFunc(e));
    };
    hubba.authenticators.del = function (id, s, e){
        return $http.delete('/hubba/api/authenticators/'+id).success(checkUndefinedFunc(s)).error(ef).error(checkUndefinedFunc(e));
    };


    /**
     *  Auth Strategies
     **/

    hubba.authenticatorStrategies = {};
    hubba.authenticatorStrategies.cache = [];
    hubba.authenticatorStrategies.hasFetched = false;

    function refreshAuthenticatorStrategiesCache(authenticatorStrategies) {
        hubba.authenticatorStrategies.cache = authenticatorStrategies;
        hubba.authenticatorStrategies.hasFetched = true;
    }

    hubba.authenticatorStrategies.get = function(o, s, e){
        if (typeof o == "string" || typeof o == "number"){
            return $http.get('/hubba/api/authenticator-strategies/'+o).success(checkUndefinedFunc(s)).error(ef).error(checkUndefinedFunc(e));
        } else {
            if (typeof o == "function"){
                e = s;
                s = o;
                return $http.get('/hubba/api/authenticator-strategies').success(refreshAuthenticatorStrategiesCache).success(checkUndefinedFunc(s)).error(ef).error(checkUndefinedFunc(e));
            } else {
                return $http.get('/hubba/api/authenticator-strategies',{params:o}).success(refreshAuthenticatorStrategiesCache).success(checkUndefinedFunc(s)).error(ef).error(checkUndefinedFunc(e));
            }
        }
    };


    /**
     *  Logs
     **/

    hubba.logs = {};
    hubba.logs.cache = [];
    hubba.logs.hasFetched = false;

    hubba.logs.get = function(){
        return $http.get('/hubba/api/logs').success(function refreshLogsCache(l){
            hubba.logs.cache = l;
            hubba.logs.hasFetched = true;
        });
    };


    hubba.$route = {};
    hubba.$route.path = "";
    hubba.$route.params = {};

    $rootScope.$on('$routeChangeSuccess', function(ev,data) {
        hubba.errors = [];
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

app.controller('authenticatorCtrl',['$scope', 'hubba', '$routeParams', '$timeout', function($, hubba, $routeParams, $timeout) {
    var autoSaveTimeout;

    hubba.authenticators.get();
    hubba.authenticatorStrategies.get();

    if (!hubba.$route.params.page) {
        hubba.$route.params.page = 'config'
    }

    delete $.authenticatorSettings;
    if ($routeParams.id) {

        if ($routeParams.id === 'new') {
            hubba.selectedAuthenticator = {};
        } else if ($routeParams.id === 'settings') {
            delete hubba.selectedAuthenticator;
            $.authenticatorSettings = {};
        } else {
            hubba.authenticators.get($routeParams.id).success(function (auth) {
                hubba.selectedAuthenticator = auth;
            })
        }
    }

    $.updateAuthenticator = function updateAuthenticatorDef(auth) {
        if (auth.id) {
            hubba.authenticators.put(auth).success(function (a) {
                $.authenticatorSaving = false;
            });
        } else {
            hubba.authenticators.post(auth).success(function (a) {
                $.authenticatorSaving = false;
            });
        }
    };

    $.authenticatorAutoSave = function authenticatorAutoSaveDef(auth) {
        $.authenticatorSaving = true;

        if (autoSaveTimeout){
            $timeout.cancel(autoSaveTimeout);
            autoSaveTimeout = undefined;
        }
        autoSaveTimeout = $timeout(function(){
            $.updateAuthenticator(auth);
        },1000);
    };
}]);

app.controller('logCtrl',['$scope', 'hubba', function($, hubba) {
    if (hubba.logs.cache.length === 0) {
        hubba.logs.get();
    }

    $.selectLog = function selectLogDef(log) {
        if ($.curLog === log) {
            delete $.curLog;
        } else {
            $.curLog = log
        }
    }
}]);

app.controller('helpCtrl',['$scope', 'hubba', function($, hubba) {
    var validDocs = ['hubba-client'],
        found = false;
    for ( var i in validDocs ){
        if (hubba.$route.params && hubba.$route.params.doc === validDocs[i]) {
            found = true;
        }
    }

    if (found){
        $.doc = '/hubba-admin/partials/help/'+hubba.$route.params.doc+'.html';
    }
}]);

app.controller('mapCtrl',['$scope','hubba',function($, hubba){

    var childrenFinder = function childrenFinderDef(item,text,type,asTree) {
            var i = item.indexOf(text),
                pathOrName = '',
                child = null,
                children = [],
                childName;

            while ( i > -1 ) {
                pathOrName = item.substring(i+text.length,item.indexOf(')',i+text.length)-1).replace('/api','').replace(/\'/g,'').replace(/\"/g,'');
                child = null;

                switch(type) {
                    case 'service':
                        for ( var j in hubba.services.cache) {
                            if (hubba.services.cache[j].path === pathOrName) {
                                childName = ('/api' + hubba.services.cache[j].path).replace(/\//g, '__');

                                if (asTree) {
                                    child = {
                                        name: childName,
                                        children: getServiceChildren(hubba.services.cache[j],true)
                                    };
                                } else {
                                    child = childName;
                                }
                                break;
                            }
                        }
                        for ( var l in hubba.authenticators.cache) {
                            if (hubba.authenticators.cache[l].name === pathOrName) {
                                childName = ('/api/login/' + hubba.authenticators.cache[l].path).replace(/\//g, '__');

                                if (asTree) {
                                    child = {
                                        name: childName,
                                        children: getAuthenticatorChildren(hubba.authenticators.cache[l],true)
                                    };
                                } else {
                                    child = childName;
                                    console.log(child);
                                }
                                break;
                            }
                        }
                        break;
                    case 'emit':
                        for ( var k in hubba.sockets.cache) {
                            if (hubba.sockets.cache[k].name === pathOrName) {
                                childName = hubba.sockets.cache[k].name.replace(/\//g, '__');

                                if (asTree) {
                                    child = {
                                        name: childName,
                                        children: getSocketChildren(hubba.sockets.cache[k],true)
                                    };
                                } else {
                                    child = childName;
                                }
                                break;
                            }
                        }
                        break;
                    case 'broadcast':
                    case 'broadcastAll':
                    case 'respond':
                        if (asTree) {
                            child = {
                                name: type,
                                children: []
                            }
                        } else {
                            child = type;
                        }
                        break;
                }


                if (child) {
                    children.push(child);
                }

                i = item.indexOf(text,i+1);
            }

            return children;
        },
        getServiceChildren = function (service,asTree) {
            var children = [];

            _.each(service.configuration,function(configItem){
                children = children.concat(childrenFinder(configItem,'hubba.get(','service',asTree));
                children = children.concat(childrenFinder(configItem,'hubba.post(','service',asTree));
                children = children.concat(childrenFinder(configItem,'hubba.put(','service',asTree));
                children = children.concat(childrenFinder(configItem,'hubba.patch(','service',asTree));
                children = children.concat(childrenFinder(configItem,'hubba.del(','service',asTree));
                children = children.concat(childrenFinder(configItem,'hubba.emit(','emit',asTree));
                children = children.concat(childrenFinder(configItem,'hubba.broadcast(','broadcast',asTree));
                children = children.concat(childrenFinder(configItem,'hubba.broadcastAll(','broadcastAll',asTree));
            });

            return children;
        },
        getSocketChildren = function (socket,asTree) {
            var children = [];

            children = children.concat(childrenFinder(socket.code,'hubba.get(','service',asTree));
            children = children.concat(childrenFinder(socket.code,'hubba.post(','service',asTree));
            children = children.concat(childrenFinder(socket.code,'hubba.put(','service',asTree));
            children = children.concat(childrenFinder(socket.code,'hubba.patch(','service',asTree));
            children = children.concat(childrenFinder(socket.code,'hubba.del(','service',asTree));
            children = children.concat(childrenFinder(socket.code,'hubba.emit(','emit',asTree));
            children = children.concat(childrenFinder(socket.code,'hubba.respond(','respond',asTree));
            children = children.concat(childrenFinder(socket.code,'hubba.broadcast(','broadcast',asTree));
            children = children.concat(childrenFinder(socket.code,'hubba.broadcastAll(','broadcastAll',asTree));

            return children;
        },
        getAuthenticatorChildren = function (authenticator,asTree) {
            var children = [];

            children = children.concat(childrenFinder(authenticator.code,'hubba.get(','service',asTree));
            children = children.concat(childrenFinder(authenticator.code,'hubba.post(','service',asTree));
            children = children.concat(childrenFinder(authenticator.code,'hubba.put(','service',asTree));
            children = children.concat(childrenFinder(authenticator.code,'hubba.patch(','service',asTree));
            children = children.concat(childrenFinder(authenticator.code,'hubba.del(','service',asTree));

            return children;
        };


    var drawRoutingTree = function(){

        var m = [20, 120, 20, 120],
            w = 1280 - m[1] - m[3],
            h = 800 - m[0] - m[2],
            i = 0,
            root;

        var tree = d3.layout.tree()
            .size([h, w]);

        var diagonal = d3.svg.diagonal()
            .projection(function(d) { return [d.y, d.x]; });

        var vis = d3.select("#map").append("svg:svg")
            .attr("width", w + m[1] + m[3])
            .attr("height", h + m[0] + m[2])
            .append("svg:g")
            .attr("transform", "translate(" + m[3] + "," + m[0] + ")");

        var root = { name: 'client', children: [] };
        root.x0 = h / 2;
        root.y0 = 0;

        // Takes a service object and returns a hash of all it's children
        //  in a form d3 is cool with by scanning the configuraiton objet.
        function getChildren(service) {
            var children = [];

            _.each(service.configuration,function(configItem){
                var i = configItem.indexOf('hubba.get(\''),
                    path = '',
                    found = false;

                while ( i > -1 ) {
                    path = configItem.substring(i+11,configItem.indexOf(')',i+11)-1).replace('/api','');
                    found = false;

                    for ( var j in hubba.services.cache) {
                        if (hubba.services.cache[j].path === path) {
                            found = hubba.services.cache[j];
                            break;
                        }
                    }

                    if (found) {
                        children.push({
                            name: '/api'+found.path,
                            children: getChildren(found)
                        });
                    }

                    i = configItem.indexOf('hubba.get(',i+1);
                }
            });

            return children;
        }

        _.each(hubba.services.cache,function(service){
            root.children.push({
                name: ('/api'+service.path).replace(/\//g,'__'),
                children: getServiceChildren(service,true)
            });
        });

        _.each(hubba.sockets.cache,function(socket){
            root.children.push({
                name: (socket.name).replace(/\//g,'__'),
                children: getSocketChildren(socket,true)
            });
        });

        _.each(hubba.authenticators.cache,function(authenticator){
            root.children.push({
                name: ('/api/login/'+authenticator.name).replace(/\//g,'__'),
                children: getAuthenticatorChildren(authenticator,true)
            });
        });

        /*_.each(hubba.services.cache,function(service){
            root.children.push({
                name: '/api'+service.path,
                children: getChildren(service)
            });
        });*/


        function toggleAll(d) {
            if (d.children) {
                d.children.forEach(toggleAll);
                toggle(d);
            }
        }

        // Initialize the display to show a few nodes.
        root.children.forEach(toggle);

        update(root);

        function update(source) {
            var duration = d3.event && d3.event.altKey ? 5000 : 500;

            // Compute the new tree layout.
            var nodes = tree.nodes(root).reverse();

            // Normalize for fixed-depth.
            nodes.forEach(function(d) { d.y = d.depth * 180; });

            // Update the nodes…
            var node = vis.selectAll("g.node")
                .data(nodes, function(d) { return d.id || (d.id = ++i); });

            // Enter any new nodes at the parent's previous position.
            var nodeEnter = node.enter().append("svg:g")
                .attr("class", "node")
                .attr("transform", function(d) { return "translate(" + source.y0 + "," + source.x0 + ")"; })
                .on("click", function(d) { toggle(d); update(d); });

            nodeEnter.append("svg:circle")
                .attr("r", 1e-6)
                .style("fill", function(d) { return d._children ? "lightsteelblue" : "#fff"; });

            nodeEnter.append("svg:text")
                .attr("x", function(d) { return d.children || d._children ? -10 : 10; })
                .attr("dy", ".35em")
                .attr("text-anchor", function(d) { return d.children || d._children ? "end" : "start"; })
                .text(function(d) { return d.name.replace(/__/g,'/'); })
                .style("fill-opacity", 1e-6);

            // Transition nodes to their new position.
            var nodeUpdate = node.transition()
                .duration(duration)
                .attr("transform", function(d) { return "translate(" + d.y + "," + d.x + ")"; });

            nodeUpdate.select("circle")
                .attr("r", 4.5)
                .style("fill", function(d) { return d._children ? "lightsteelblue" : "#fff"; });

            nodeUpdate.select("text")
                .style("fill-opacity", 1);

            // Transition exiting nodes to the parent's new position.
            var nodeExit = node.exit().transition()
                .duration(duration)
                .attr("transform", function(d) { return "translate(" + source.y + "," + source.x + ")"; })
                .remove();

            nodeExit.select("circle")
                .attr("r", 1e-6);

            nodeExit.select("text")
                .style("fill-opacity", 1e-6);

            // Update the links…
            var link = vis.selectAll("path.link")
                .data(tree.links(nodes), function(d) { return d.target.id; });

            // Enter any new links at the parent's previous position.
            link.enter().insert("svg:path", "g")
                .attr("class", "link")
                .attr("d", function(d) {
                    var o = {x: source.x0, y: source.y0};
                    return diagonal({source: o, target: o});
                })
                .transition()
                .duration(duration)
                .attr("d", diagonal);

            // Transition links to their new position.
            link.transition()
                .duration(duration)
                .attr("d", diagonal);

            // Transition exiting nodes to the parent's new position.
            link.exit().transition()
                .duration(duration)
                .attr("d", function(d) {
                    var o = {x: source.x, y: source.y};
                    return diagonal({source: o, target: o});
                })
                .remove();

            // Stash the old positions for transition.
            nodes.forEach(function(d) {
                d.x0 = d.x;
                d.y0 = d.y;
            });
        }

        // Toggle children.
        function toggle(d) {
            if (d.children) {
                d._children = d.children;
                d.children = null;
            } else {
                d.children = d._children;
                d._children = null;
            }
        }


    };



    var drawDepsGraph = function() {
        /* dependency tree */
        var packages = {

            // Lazily construct the package hierarchy from class names.
            root: function(classes) {
                var map = {};

                function find(name, data) {
                    var node = map[name], i;
                    if (!node) {
                        node = map[name] = data || {name: name, children: []};
                        if (name.length) {
                            node.parent = find(name.substring(0, i = name.lastIndexOf(".")));
                            node.parent.children.push(node);
                            node.key = name.substring(i + 1);
                        }
                    }
                    return node;
                }

                classes.forEach(function(d) {
                    find(d.name, d);
                });

                return map[""];
            },

            // Return a list of imports for the given array of nodes.
            imports: function(nodes) {
                var map = {},
                    imports = [];

                // Compute a map from name to node.
                nodes.forEach(function(d) {
                    map[d.name] = d;
                });

                // For each import, construct a link from the source to target node.
                nodes.forEach(function(d) {
                    if (d.imports) d.imports.forEach(function(i) {
                        imports.push({source: map[d.name], target: map[i]});
                    });
                });

                return imports;
            }

        };

        var services = [{name:'respond',imports:[]},{name:'broadcast',imports:[]},{name:'broadcastAll',imports:[]}];

        _.each(hubba.services.cache,function(service){
            services.push({
                name: ('/api'+service.path).replace(/\//g,'__'),
                imports: getServiceChildren(service)
            });
        });

        _.each(hubba.sockets.cache,function(socket){
            services.push({
                name: (socket.name).replace(/\//g,'__'),
                imports: getSocketChildren(socket)
            });
        });

        _.each(hubba.authenticators.cache,function(authenticator){
            services.push({
                name: ('/api/login/'+authenticator.name).replace(/\//g,'__'),
                imports: getAuthenticatorChildren(authenticator)
            });
        });


        var w = 1280,
            h = 800,
            rx = w / 2,
            ry = h / 2,
            m0,
            rotate = 0;

        var splines = [];

        var cluster = d3.layout.cluster()
            .size([360, ry - 120])
            .sort(function(a, b) { return d3.ascending(a.key, b.key); });

        var bundle = d3.layout.bundle();

        var line = d3.svg.line.radial()
            .interpolate("bundle")
            .tension(.85)
            .radius(function(d) { return d.y; })
            .angle(function(d) { return d.x / 180 * Math.PI; });

        // Chrome 15 bug: <http://code.google.com/p/chromium/issues/detail?id=98951>
        var div = d3.select("#map2").insert("div", "h2")
            .style("width", w + "px")
            .style("height", w + "px")
            .style("position", "absolute")
            .style("-webkit-backface-visibility", "hidden");

        var svg = div.append("svg:svg")
            .attr("width", w)
            .attr("height", w)
            .append("svg:g")
            .attr("transform", "translate(" + rx + "," + ry + ")");

        svg.append("svg:path")
            .attr("class", "arc")
            .attr("d", d3.svg.arc().outerRadius(ry - 120).innerRadius(0).startAngle(0).endAngle(2 * Math.PI))
            .on("mousedown", mousedown);

        var nodes = cluster.nodes(packages.root(services)),
            links = packages.imports(nodes),
            splines = bundle(links);

        var path = svg.selectAll("#map2 path.link")
            .data(links)
            .enter().append("svg:path")
            .attr("class", function(d) { return "link source-" + d.source.key + " target-" + d.target.key; })
            .attr("d", function(d, i) { return line(splines[i]); });

        svg.selectAll("#map2 g.node")
            .data(nodes.filter(function(n) { return !n.children; }))
            .enter().append("svg:g")
            .attr("class", "node")
            .attr("id", function(d) { return "node-" + d.key; })
            .attr("transform", function(d) { return "rotate(" + (d.x - 90) + ")translate(" + d.y + ")"; })
            .append("svg:text")
            .attr("dx", function(d) { return d.x < 180 ? 8 : -8; })
            .attr("dy", ".31em")
            .attr("text-anchor", function(d) { return d.x < 180 ? "start" : "end"; })
            .attr("transform", function(d) { return d.x < 180 ? null : "rotate(180)"; })
            .text(function(d) { return d.key.replace(/__/g,'/'); })
            .on("mouseover", mouseover)
            .on("mouseout", mouseout);

        d3.select("#map2 input[type=range]").on("change", function() {
            line.tension(this.value / 100);
            path.attr("d", function(d, i) { return line(splines[i]); });
        });

        d3.select("#map2")
            .on("mousemove", mousemove)
            .on("mouseup", mouseup);

        function mouse(e) {
            return [e.pageX - rx, e.pageY - ry];
        }

        function mousedown() {
            m0 = mouse(d3.event);
            d3.event.preventDefault();
        }

        function mousemove() {
            if (m0) {
                var m1 = mouse(d3.event),
                    dm = Math.atan2(cross(m0, m1), dot(m0, m1)) * 180 / Math.PI;
                div.style("-webkit-transform", "translateY(" + (ry - rx) + "px)rotateZ(" + dm + "deg)translateY(" + (rx - ry) + "px)");
            }
        }

        function mouseup() {
            if (m0) {
                var m1 = mouse(d3.event),
                    dm = Math.atan2(cross(m0, m1), dot(m0, m1)) * 180 / Math.PI;

                rotate += dm;
                if (rotate > 360) rotate -= 360;
                else if (rotate < 0) rotate += 360;
                m0 = null;

                div.style("-webkit-transform", null);

                svg
                    .attr("transform", "translate(" + rx + "," + ry + ")rotate(" + rotate + ")")
                    .selectAll("#map2 g.node text")
                    .attr("dx", function(d) { return (d.x + rotate) % 360 < 180 ? 8 : -8; })
                    .attr("text-anchor", function(d) { return (d.x + rotate) % 360 < 180 ? "start" : "end"; })
                    .attr("transform", function(d) { return (d.x + rotate) % 360 < 180 ? null : "rotate(180)"; });
            }
        }

        function mouseover(d) {
            svg.selectAll("#map2 path.link.target-" + d.key.replace(/\//g,'~'))
                .classed("target", true)
                .each(updateNodes("source", true));

            svg.selectAll("#map2 path.link.source-" + d.key.replace(/\//g,'~'))
                .classed("source", true)
                .each(updateNodes("target", true));
        }

        function mouseout(d) {
            svg.selectAll("#map2 path.link.source-" + d.key.replace(/\//g,'~'))
                .classed("source", false)
                .each(updateNodes("target", false));

            svg.selectAll("#map2 path.link.target-" + d.key.replace(/\//g,'~'))
                .classed("target", false)
                .each(updateNodes("source", false));
        }

        function updateNodes(name, value) {
            return function(d) {
                if (value) this.parentNode.appendChild(this);
                svg.select("#map2 #node-" + d[name].key.replace(/\//g,'~')).classed(name, value);
            };
        }

        function cross(a, b) {
            return a[0] * b[1] - a[1] * b[0];
        }

        function dot(a, b) {
            return a[0] * b[0] + a[1] * b[1];
        }
    };

    var tryToDrawGraphs = function(){
        if (hubba.services.hasFetched && hubba.sockets.hasFetched && hubba.authenticators.hasFetched) {
            drawRoutingTree();
            drawDepsGraph();
        }
    }

    if (hubba.services.hasFetched === false) {
        hubba.services.get(tryToDrawGraphs);
    }

    if (hubba.sockets.hasFetched === false) {
        hubba.sockets.get(tryToDrawGraphs);
    }

    if (hubba.authenticators.hasFetched === false) {
        hubba.authenticators.get(tryToDrawGraphs);
    }

    tryToDrawGraphs();

}]);

app.controller('loginCtrl',['$scope','hubba', '$route', function($, hubba, $route){
    $.login = function(){
        hubba.login({username: $.username, password: $.password}).success(function(){
            $.username = '';
            $.password = '';
            $route.reload();
        });
    }
}]);

app.controller('serviceCtrl',['$scope','hubba','$timeout','$location', function($, hubba, $timeout, $location){

    var autoSaveTimeout;

    hubba.authenticators.get();

    $.serviceSaving = false;
    $.filterIt = function() {
        return $filter('orderBy')(hubba.services.cache, 'seq');
    };
    $.updateSeq = function updateSeqDef(e,ui) {
        // find the element that's out of order and update it
        var id = parseInt(ui.item[0].id.replace('service_','')); // the id is stored in the id field of each element as 'service_id'

        for ( var i = 0; i < hubba.services.cache.length; i++ ) {
            if (hubba.services.cache[i].id === id) {
                if (i === 0) {
                    hubba.services.cache[i].seq = 0;
                } else {
                    hubba.services.cache[i].seq = hubba.services.cache[i-1].seq+1;
                }
                $.saveService(hubba.services.cache[i]);
                break;
            }
        }

    };

    function selectServiceFromRoute() {
        if (hubba.$route.params.id) {
            if (hubba.$route.params.id === 'new') {
                hubba.selectedService = {
                    path: '',
                    type: 'controller',
                    configuration: {}
                };
            } else {
                hubba.selectedService = _.find(hubba.services.cache,{ id: parseInt(hubba.$route.params.id) });
            }

            if (!hubba.$route.params.page) {
                hubba.$route.params.page = 'config'
            }
        }
    }

    if (hubba.services.cache.length === 0) {
        hubba.services.get(selectServiceFromRoute);
        hubba.serviceTypes.get();
    } else {
        selectServiceFromRoute();
    }

    $.selectService = function selectServiceDef(service) {
        hubba.selectedService = service;
    };

    $.serviceAutoSave = function serviceAutoSaveDef(service) {
        $.serviceSaving = true;

        if (autoSaveTimeout){
            $timeout.cancel(autoSaveTimeout);
            autoSaveTimeout = undefined;
        }
        autoSaveTimeout = $timeout(function(){
            $.updateService(service);
        },1000);
    };

    $.updateService = function updateServiceDef(service) {
        return hubba.services.put(service).success(function(s){
            $.serviceSaving = false;
        });
    };

    $.toggleServiceAuth = function toggleServiceAuthDef(service) {
        service.requiresAuthentication = !service.requiresAuthentication;
        $.saveService(service);
    }

    $.typeChanged = function(){
        // set the configuration to the defaults of the new type
        hubba.selectedService.configuration = {};

        for (key in hubba.serviceTypes.cache[hubba.selectedService.type].configuration){
            hubba.selectedService.configuration[key] = hubba.serviceTypes.cache[hubba.selectedService.type].configuration[key].value;
        }
    };

    $.saveService = function saveNewServiceDef(s) {
        $.serviceSaving = true;
        var service = s || hubba.selectedService,
            verb = 'post',
            id = service.id,
            args = [service];

        if (typeof service.seq === 'undefined') {
            service.seq = 0;
        }

        if (id) {
            verb = 'put';
            args.unshift(id);
        }

        hubba.services[verb].apply(this,args).success(function(result){
            $.serviceSaving = false;
            $.showNewServiceForm = false;
            /*hubba.services.cache.forEach(function(item){
                if (item.id != result.id && item.seq >= result.seq) {
                    item.seq++;
                }
            });*/
            hubba.services.get();
            $location.path('/hubba-admin/services/'+ hubba.selectedService.id);
        }).error(function(){
            $.serviceSaving = false;
        });
    };

    $.deleteService = function deleteServiceDef(service) {
        hubba.services.del(service.id);
    };


    $.selectServiceFromList = function selectServiceFromListDef(service) {
        $.selectedServiceFromList = service;
    };

    $.removeServiceFromList = function removeServiceFromListDef() {
        $.deleteService($.selectedServiceFromList);
    };

}]);

app.directive('serviceControllerCode',['hubba','$timeout',function(hubba, $timeout){
    return {
        replace: false,
        templateUrl: '/hubba-admin/partials/controllerCodeArea.html',
        link: function ($, element, attrs) {
            $.verb = attrs['serviceVerb'];
            $.code = hubba.selectedService.configuration[$.verb];

            var first = true,
                controllerTimeout;

            function saveService(){
                hubba.services.put(hubba.selectedService.id,hubba.selectedService,function(r){
                    hubba.selectedService = r;
                    $timeout(function(){
                        $.controllerSaving = false;
                    },100);
                });
            }

            $.updateControllerCode = function updateControllerCode(code,instant){
                $.controllerSaving = true;
                hubba.selectedService.configuration[$.verb] = code;

                if (controllerTimeout){
                    $timeout.cancel(controllerTimeout);
                }

                if (instant){
                    saveService();
                } else {
                    controllerTimeout = $timeout(function(){
                        saveService();
                    },1000);
                }
            };
        }
    };
}]);

app.controller('childFileCtrl',['$scope','hubba','$location','$route',function($,hubba,$location,$route){

    $.isFolder = function isFolderDef(child) {
        return typeof child === 'object' && !(child.id && child.path);
    };

    $.isFile = function isFileDef(child) {
        return typeof child === 'object' && (child.id && child.path);
    };

    function validateFileName(newName,oldName) {
        return !(newName.length === 0 ||
                 newName.indexOf('..') > -1 ||
                 newName.indexOf('/') > -1 ||
                 newName.indexOf('.') === -1 ||
                 newName === oldName);
    }

    $.closeNewFileInput = function closeNewFileInputDef(child,e) {

        $.showNewFileInput.valid = validateFileName($.showNewFileInput.value);

        if (child && child[$.showNewFileInput.value]) {
            $.showNewFileInput.valid = false;
        }

        if (e) {
            if (e.keyCode === 27) { // escape
                $.showNewFileInput.path = undefined;
                $.showNewFileInput.value = '';
            } else if (e.keyCode === 13 && $.showNewFileInput.valid) { //enter
                $.createFile({ path: (child.path + '/' + $.showNewFileInput.value).replace('//','/') }).success(function(file) {
                    $.showNewFileInput.path = undefined;
                    $.showNewFileInput.value = '';
                    $location.path('/hubba-admin/files/'+file.id);
                });
            }
        } else {
            $.showNewFileInput.path = undefined;
            $.showNewFileInput.value = '';
        }
    };

    function validateFolderName(newName,oldName) {
        return !(newName.length === 0 ||
                newName.indexOf('/') > -1 ||
                newName.indexOf('.') > -1 ||
                newName.trim().indexOf(' ') > -1 ||
                '/'+newName === oldName);
    }

    $.closeRenameFolderInput = function closeRenameFolderInputDef(child,e) {

        $.showRenameFolderInput.valid = validateFolderName($.showRenameFolderInput.value,child.path);

        if (e) {
            if (e.keyCode === 27) { // escape
                $.showRenameFolderInput.path = undefined;
                $.showRenameFolderInput.value = child.path;
            } else if (e.keyCode === 13) { //enter

                // check value valid and changed
                if ($.showRenameFolderInput.valid) {
                    hubba.files.renameFolder({ oldPath: child.path, newPath: '/'+$.showRenameFolderInput.value.trim() }).success(function() {
                        $.showRenameFolderInput.path = undefined;
                        $route.reload();
                    });
                } else {
                    $.showRenameFolderInput.path = undefined;
                    $.showRenameFolderInput.value = child.path;
                }
            }
        } else {
            $.showRenameFolderInput.path = undefined;
            $.showRenameFolderInput.value = child.path;
        }
    };

    $.closeNewFolderInput = function closeNewFolderInputDef(child,e) {
        $.showNewFolderInput.valid = validateFolderName($.showNewFolderInput.value);

        if (child && child[$.showNewFolderInput.value]) {
            $.showNewFolderInput.valid = false;
        }
        if (e) {
            if (e.keyCode === 27) { // escape
                $.showNewFolderInput.path = undefined;
                $.showNewFolderInput.value = '';
            } else if (e.keyCode === 13 && $.showNewFolderInput.valid) { //enter

                var newF = {
                    path: child.path+'/'+$.showNewFolderInput.value
                };

                if (child.path === '/') {
                    hubba.files.cache[$.showNewFolderInput.value] = newF;
                } else {
                    child[$.showNewFolderInput.value] = newF;
                }

                $.showNewFolderInput.path = undefined;
                $.showNewFolderInput.value = '';
            }
        } else {
            $.showNewFolderInput.path = undefined;
            $.showNewFolderInput.value = '';
        }
    };

}]);

app.controller('fileCtrl',['$scope', 'hubba', '$timeout', '$location', function($, hubba, $timeout, $location) {
    var autoSaveTimeout;

    $.fileSaving = false;

    if (Object.keys(hubba.files.cache).length === 0) {
        hubba.files.get(selectFileFromRoute);
    } else {
        selectFileFromRoute();
    }

    $.selectFile = function selectFileDef(file) {
        hubba.selectedfile = file;
    };

    $.fileAutoSave = function fileAutoSaveDef(file) {
        $.fileSaving = true;

        if (autoSaveTimeout){
            $timeout.cancel(autoSaveTimeout);
        }

        autoSaveTimeout = $timeout(function(){
            $.updateFile(file);
        },1000);
    };

    $.updateFile = function updateFileDef(file) {
        return hubba.files.put(file).success(function(s){
            $.fileSaving = false;
        });
    };

    $.createFile = function createFileDef(file) {
        return hubba.files.post(file);
    };

    $.fileMode = 'javascript';

    function aceOnload(_editor){
        // Options
        _editor.setShowPrintMargin(false);
    }

    $.fileAceOptions = {
       onLoad: aceOnload
    };

    $.deletefile = function deletefileDef(file) {

        return hubba.files.del(file.id).success(function removeFromTreeDef(obj) {

            var f = obj || hubba.files.cache;

            if (file.path.indexOf(f.path) > -1) {
                for ( var key in f ) {
                    if (typeof f[key] === 'object' && f[key].path) {
                        if (f[key].path === file.path) {
                            delete f[key];
                            if (hubba.selectedFile && hubba.selectedFile.id === file.id) {
                                delete hubba.selectedFile;
                                $location.path('/hubba-admin/files');
                            }
                            return;
                        } else {
                            removeFromTreeDef(f[key]);
                        }
                    }
                }
            }

        });
    };

    function selectFileFromRoute() {

        delete hubba.selectedFile;

        if (hubba.$route.params.id) {
            $.loadingFile = true;
            $.fileSelected = false;
            hubba.files.get(hubba.$route.params.id).success(function(file){

                var fileMode = 'javascript';

                if (file.path.indexOf('.html') > -1) {
                    fileMode = 'html';
                } else if (file.path.indexOf('.css') > -1) {
                    fileMode = 'css';
                }

                $.fileAceOptions.mode = fileMode;
                hubba.selectedFile = file;
                $.fileSelected = true;
                expandFilePath(file.path);
            }).finally(function(){
                    $.loadingFile = false;
            });
        }
    }

    function expandFilePath(path){
        var cur = hubba.files.cache;
        path.split("/").slice(1).forEach(function(el){
            if (cur[el]) {
                cur[el].__expanded__ = true;
            }
            cur = cur[el] || {};
        });
    }

    $.selectFileFromTree = function selectFileFromTreeDef(file) {
        $.selectedFileFromTree = file;
    };

    $.showFileRenameInputFromTree = function showRenameInputFromTreeDef() {
        $.fileRenameInput = $.selectedFileFromTree;

        // let angular do it's thing then set the element focus
        setTimeout(function(){
            document.getElementById('renameInput_'+$.fileRenameInput.id).focus();
        });
    };

    $.closeFileRenameInput = function closeFileRenameInput(e,file,name) {
        if (e) {
            if (e.keyCode === 27) { // escape
                $.fileRenameInput = undefined;
            } else if (e.keyCode === 13) { //enter
                var oldPath = file.path,
                    newPath = file.path.split('/');

                newPath[newPath.length-1] = name;
                file.path = newPath.join('/');

                if (oldPath !== file.path) {
                    $.updateFile(file).success(function(){
                        $.fileRenameInput = undefined;
                        // TODO: update name in the tree cache
                    });
                } else {
                    $.fileRenameInput = undefined;
                }
            }
        } else {
            $.fileRenameInput = undefined;
        }
    };

    $.newFileFromTree = function newFileFromTree() {
        $.newFileName = '';
        $.showNewFileInput = {
            value: '',
            path: $.selectedFolderFromTree.path,
            valid: false
        };
        // let angular do it's thing then set the element focus
        setTimeout(function(){
            document.getElementById('newFileInput_'+$.selectedFolderFromTree.path).focus();
        });
    };

    $.renameFileFromTree = function renameFileFromTreeDef() {

    };

    $.removeFileFromTree = function renameFileFromTreeDef() {
        $.deletefile($.selectedFileFromTree);
    };

    $.selectFolderFromTree = function selectFolderFromTreeDef(folder) {
        $.selectedFolderFromTree = folder;
    };

    $.newFolderFromTree = function newFolderFromTreeDef() {
        $.showNewFolderInput = {
            value: '',
            path: $.selectedFolderFromTree.path
        };
        // let angular do it's thing then set the element focus
        setTimeout(function(){
            document.getElementById('newFolderInput_'+$.showNewFolderInput.path).focus();
        });
    };

    $.renameFolderFromTree = function renameFolderFromTreeDef() {
        $.showRenameFolderInput = {
            path: $.selectedFolderFromTree.path
        };
        // let angular do it's thing then set the element focus
        setTimeout(function(){
            document.getElementById('renameFolderInput_'+$.selectedFolderFromTree.path).focus();
        });
    };

    $.removeFolderFromTree = function renameFolderFromTreeDef() {
        hubba.files.removeFolder($.selectedFolderFromTree).success(function(){
            if (hubba.selectedFile.path.indexOf($.selectedFolderFromTree.path) > -1) {
                $location.path('/hubba-admin/files');
            }
        });
    };

    $.rightClickMenus = {};

    $.toggleRightClickMenuButtons = function toggleRightClickMenuButtonsDef(menuName) {
        $.rightClickMenus.rootRightClickMenu = false;
        $.rightClickMenus.fileRightClickMenu = false;
        $.rightClickMenus.folderRightClickMenu = false;
        $.rightClickMenus[menuName] = true;
    };

}]);

app.controller('body',['$scope', 'hubba', function($, hubba) {
    $.aceLoaded = function(_editor){
        // Options
        _editor.setShowPrintMargin(false);
    };
}]);


app.controller('socketCtrl',['$scope','hubba','$timeout','$location', function($, hubba, $timeout, $location){

    var autoSaveTimeout;

    $.socketSaving = false;

    if (hubba.sockets.cache.length === 0) {
        hubba.sockets.get(selectSocketFromRoute);
    } else {
        selectSocketFromRoute();
    }

    $.selectSocket = function selectSocketDef(socket) {
        hubba.selectedSocket = socket;
    };

    $.socketAutoSave = function socketAutoSaveDef(socket) {
        $.socketSaving = true;

        if (autoSaveTimeout){
            $timeout.cancel(autoSaveTimeout);
            autoSaveTimeout = undefined;
        }
        autoSaveTimeout = $timeout(function(){
            $.updateSocket(socket);
        },1000);
    };

    $.updateSocket = function updateSocketDef(socket) {
        hubba.sockets.put(socket).success(function(s){
            $.socketSaving = false;
        });
    };

    $.newSocket = function newSocketDef() {
        $.newSocketName = '';
        $.showNewSocketInput = true;
        // let angular do it's thing then set the element focus
        setTimeout(function(){
            document.getElementById('newSocketInput').focus();
        });
    };

    $.saveNewSocket = function saveNewSocketDef(e) {
        if(e.keyCode === 13){
            $.newSocketSaving = true;
            hubba.sockets.post({name:$.newSocketName}).success(function(s){
                hubba.sockets.cache.push(s);
                $.newSocketSaving = false;
                $.showNewSocketInput = false;
                //hubba.selectedSocket = s;
                $location.path('/hubba-admin/sockets/'+ s.name);
            }).error(function(){
                $.newSocketSaving = false;
            });
        }
    };

    $.selectSocketFromList = function selectSocketFromListDef(socket) {
        $.selectedSocketFromList = {
            id: socket.id,
            name: socket.name,
            originalName: socket.name,
            valid: false,
            rename: false,
            requiresAuthentication: socket.requiresAuthentication
        };
    };

    $.toggleSocketAuthFromList = function toggleSocketAuthFromListDef() {
        var socket = _.find(hubba.sockets.cache, function(s) { return s.id === $.selectedSocketFromList.id });
        socket.requiresAuthentication = !socket.requiresAuthentication;
        $.updateSocket(socket);
    };

    $.removeSocketFromList = function removeSocketFromListDef() {
        $.deleteSocket($.selectedSocketFromList);
    };

    $.renameSocketFromList = function renameSocketFromListDef() {
        $.selectedSocketFromList.rename = true;
        // let angular do it's thing then set the element focus
        setTimeout(function(){
            document.getElementById('socketRenameInput_'+$.selectedSocketFromList.id).focus();
        });
    };

    $.closeSocketRenameInput = function closeSocketRenameInputDef(e) {

        if (e) {

            $.selectedSocketFromList.valid = true;

            if ($.selectedSocketFromList.originalName === $.selectedSocketFromList.name ||
                $.selectedSocketFromList.name.length === 0) {
                $.selectedSocketFromList.valid = false;
            }

            if (e.keyCode === 27) { // escape
                delete $.selectedSocketFromList;
            } else if (e.keyCode === 13) { //enter

                if ($.selectedSocketFromList.valid === true) {
                    hubba.sockets.put({
                        id: $.selectedSocketFromList.id,
                        name: $.selectedSocketFromList.name
                    }).success(function(updatedSocket){
                        delete $.selectedSocketFromList;
                        for ( var i = 0 ; i < hubba.sockets.cache.length; i++ ) {
                            if (hubba.sockets.cache[i].id === updatedSocket.id) {
                                hubba.sockets.cache[i] = updatedSocket;
                            }
                        }
                    });
                } else {
                    delete $.selectedSocketFromList;
                }
            }
        } else {
            delete $.selectedSocketFromList;
        }
    };


    $.deleteSocket = function deleteSocketDef(socket) {
        hubba.sockets.del(socket).success(function(){
            for ( var i = 0; i < hubba.sockets.cache.length; i++ ) {
                if (hubba.sockets.cache[i].name === socket.name) {
                    hubba.sockets.cache.splice(i,1);
                    break;
                }
            }
            delete hubba.selectedSocket;
        });
    };

    function selectSocketFromRoute() {
        if (hubba.$route.params.name) {
            for ( var i = 0; i < hubba.sockets.cache.length; i++ ) {
                if (hubba.sockets.cache[i].name === hubba.$route.params.name) {
                    hubba.selectedSocket = hubba.sockets.cache[i];
                    break;
                }
            }
        }
    }

}]);

app.controller('childOutputCtrl',['$scope','hubba',function($scope,hubba){

}]);