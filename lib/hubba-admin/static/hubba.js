var app = angular.module('hubba',['ngRoute','ui.ace']);

app.config(['$routeProvider', '$locationProvider', function($routeProvider, $locationProvider) {

    $routeProvider
        .when('/hubba-admin/', { templateUrl: '/hubba-admin/partials/index.html', controller: 'indexCtrl' })
        .when('/hubba-admin/resources/', { templateUrl: '/hubba-admin/partials/resources.html', controller: 'resourceCtrl' })
        .when('/hubba-admin/resources/:resourcesId', { templateUrl: '/hubba-admin/partials/resources.html', controller: 'resourceCtrl' })
        .when('/hubba-admin/sockets/', { templateUrl: '/hubba-admin/partials/sockets.html', controller: 'socketCtrl' })
        .when('/hubba-admin/sockets/:name', { templateUrl: '/hubba-admin/partials/sockets.html', controller: 'socketCtrl' })
        .when('/hubba-admin/files/', { templateUrl: '/hubba-admin/partials/files.html', controller: 'fileCtrl' })
        .when('/hubba-admin/files/:id', { templateUrl: '/hubba-admin/partials/files.html', controller: 'fileCtrl' })
        .when('/hubba-admin/help', { templateUrl: '/hubba-admin/partials/help.html', controller: 'helpCtrl'})
        .when('/hubba-admin/help/:doc', { templateUrl: '/hubba-admin/partials/help.html', controller: 'helpCtrl' })
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

    hubba.resources = {};
    hubba.resources.cache = {};

    hubba.resources.get = function(o, s, e){
        if (typeof o == "string" || typeof o == "number"){
            $http.get('/hubba/api/resources/'+o).success(checkUndefinedFunc(s)).error(ef).error(checkUndefinedFunc(e));
        } else{
            if (typeof o == "function"){
                e = s;
                s = o;
                $http.get('/hubba/api/resources?tree=true').success(checkUndefinedFunc(s)).error(ef).error(checkUndefinedFunc(e));
            } else {
                $http.get('/hubba/api/resources?tree=true',{params:o}).success(checkUndefinedFunc(s)).error(ef).error(checkUndefinedFunc(e));
            }
        }
    };

    hubba.resources.put = function(id, o, s, e){
        $http.put('/hubba/api/resources/'+id,o).success(checkUndefinedFunc(s)).error(ef).error(checkUndefinedFunc(e));
    };

    hubba.resources.post = function(o, s, e){
        $http.post('/hubba/api/resources',o).success(checkUndefinedFunc(s)).error(ef).error(checkUndefinedFunc(e));
    };

    hubba.resources.patch = function(id, o, s, e){
        $http.patch('/hubba/api/resources'+id,o).success(checkUndefinedFunc(s)).error(ef).error(checkUndefinedFunc(e));
    };

    hubba.resources.del = function (id, s, e){
        $http.delete('/hubba/api/resources/'+id).success(checkUndefinedFunc(s)).success(function(){
            $location.path('/hubba-admin/resources').search({});
        }).success(function removeFromCache(res){
            if (!res){
                res = hubba.resources.cache.resourcesRoot;
            }
            for (var key in res.children){
                if (res.children[key].id == id){
                    delete res.children[key];
                    return;
                }
                removeFromCache(res.children[key]);
            }
            delete hubba.resources.lastPage;
            delete hubba.selectedResource;
        }).error(ef).error(checkUndefinedFunc(e));
    };

    hubba.resourceTypes = {};
    hubba.resourceTypes.cache = {};

    hubba.resourceTypes.get = function(o, s, e){
        if (typeof o == "string" || typeof o == "number"){
            $http.get('/hubba/api/resource_types/'+o).success(checkUndefinedFunc(s)).error(ef).error(checkUndefinedFunc(e));
        } else{
            if (typeof o == "function"){
                e = s;
                s = o;
                $http.get('/hubba/api/resource_types?object=true').success(checkUndefinedFunc(s)).error(ef).error(checkUndefinedFunc(e));
            } else {
                $http.get('/hubba/api/resource_types?object=true',{params:o}).success(checkUndefinedFunc(s)).error(ef).error(checkUndefinedFunc(e));
            }
        }
    };

    function refreshSocketsCache(sockets) {
        hubba.sockets.cache = sockets;
    }

    hubba.sockets = {};
    hubba.sockets.cache = [];

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
        return $http.put('/hubba/api/sockets/'+ o.name,o).success(checkUndefinedFunc(s)).error(ef).error(checkUndefinedFunc(e));
    };
    hubba.sockets.post = function(o, s, e){
        return $http.post('/hubba/api/sockets',o).success(checkUndefinedFunc(s)).error(ef).error(checkUndefinedFunc(e));
    };

    hubba.sockets.patch = function(o, s, e){
        return $http.patch('/hubba/api/sockets/'+ o.name,o).success(checkUndefinedFunc(s)).error(ef).error(checkUndefinedFunc(e));
    };
    hubba.sockets.del = function (name, s, e){
        return $http.delete('/hubba/api/sockets/'+name).success(checkUndefinedFunc(s)).success(function(){
            $location.path('/hubba-admin/sockets').search({});
        }).error(ef).error(checkUndefinedFunc(e));
    };

    hubba.files = {};
    hubba.files.cache = {};


    function refreshFilesCache(filesTree){
        hubba.files.cache = filesTree;
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
        return $http.put('/hubba/api/files/'+ o.id,o).success(checkUndefinedFunc(s)).error(ef).error(checkUndefinedFunc(e));
    };
    hubba.files.post = function(o, s, e){
        return $http.post('/hubba/api/files',o).success(checkUndefinedFunc(s)).error(ef).error(checkUndefinedFunc(e));
    };

    hubba.files.patch = function(o, s, e){
        return $http.patch('/hubba/api/files/'+ o.id,o).success(checkUndefinedFunc(s)).error(ef).error(checkUndefinedFunc(e));
    };
    hubba.files.del = function (id, s, e){
        return $http.delete('/hubba/api/files/'+id).success(checkUndefinedFunc(s)).success(function(){
            $location.path('/hubba-admin/files').search({});
        }).error(ef).error(checkUndefinedFunc(e));
    };

    hubba.$route = {};
    hubba.$route.path = "";
    hubba.$route.params = {};

    $rootScope.$on('$routeChangeSuccess', function(ev,data) {
        hubba.errors = [];
        if (data.$$route && data.$$route.originalPath){
            hubba.$route.path = data.$$route.originalPath;
            hubba.$route.params = data.params;
            if (data.params.page) {
                hubba.resources.lastPage = data.params.page;
            }
        }
    });

    $rootScope.hubba = hubba;

    return hubba;
}]);


app.controller('indexCtrl',['$scope', 'hubba', function($scope, hubba) {

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

app.controller('resourceCtrl',['$scope', 'hubba', '$location', function($scope, hubba, $location) {

    if (typeof hubba.selectedResource == 'undefined'){
        hubba.selectedResource = {};
    }

    var selectResource = function(id){
            hubba.resources.get(id,function(r){
                hubba.selectedResource = r;
                expandResources(r.parentId,hubba.resources.cache.resourcesRoot);
            });
        };

    $scope.typeChanged = function(){
        // set the configuration to the defaults of the new type
        hubba.selectedResource.configuration = {};
        for (key in hubba.resourceTypes[hubba.selectedResource.type].configuration){
            hubba.selectedResource.configuration[key] = hubba.resourceTypes[hubba.selectedResource.type].configuration[key].value;
        }
    };

    if (typeof hubba.resources.cache.resourcesRoot == 'undefined'){
        hubba.resources.get(function(r){

            $scope.resourcesRoot = hubba.resources.cache.resourcesRoot = r;

            if (hubba.$route.params.resourcesId){
                selectResource(hubba.$route.params.resourcesId);
            }
        });

        hubba.resourceTypes.get(function(r){
            hubba.resourceTypes = r;
        });
    } else if (hubba.selectedResource.id && !hubba.$route.params.resourcesId) {
        $location.path('/hubba-admin/resources/'+hubba.selectedResource.id).search({page:hubba.resources.lastPage || 'config'});
    } else {
        $scope.resourcesRoot = hubba.resources.cache.resourcesRoot;

        if (hubba.$route.params.resourcesId){
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
    };

    function updateResource(updatedResource){
        var t = findById(updatedResource.id);
        for ( var key in updatedResource){
            t[key] = updatedResource[key];
        }
    };

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
    };

    function minimizeResources(resource){
        resource.expanded = false;
        for (var key in resource.children){
            minimizeResources(resource.children[key]);
        }
    };

    $scope.saveResource = function(res){
        hubba.resources.put(res.id,res,function(r){
            //updateResource(r);
            res = r;
            hubba.selectedResource = r;
            $scope.controllerSaving = false;
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

    /*
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
    }];*/

}]);

app.controller('childOutputCtrl',['$scope','hubba',function($scope,hubba){

}]);

app.controller('childResourceCtrl',['$scope','hubba','$location',function($scope,hubba,$location){
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
            $scope.deleted = false;
            $location.path('/hubba-admin/resources/'+ r.id).search({page:'config'});
        });
    };

    $scope.hasChildren = function(children){
        return Object.keys(children || {}).length;
    };

}]);

app.controller('childFileCtrl',['$scope','hubba','$location',function($scope,hubba,$location){
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
            $scope.deleted = false;
            $location.path('/hubba-admin/resources/'+ r.id).search({page:'config'});
        });
    };

    $scope.isFolder = function isFolderDef(child) {
        return typeof child === 'object';
    };

    $scope.isFile = function isFileDef(child) {
        return typeof child === 'number';
    };

}]);

app.controller('fileCtrl',['$scope', 'hubba', '$timeout', function($, hubba, $timeout) {
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
        hubba.files.put(file).success(function(s){
            $.fileSaving = false;
        });
    };

    $.newFile = function newFileDef() {
        $.newFileName = '';
        $.showNewFileInput = true;
        // let angular do it's thing then set the element focus
        setTimeout(function(){
            document.getElementById('newFileInput').focus();
        });
    };

    // TODO: when saving a new file with just a filename pass in a reference to the parent
    //  so we know where to put this thing in the tree
    $.saveNewFile = function saveNewFileDef(e) {
        if(e.keyCode === 13){
            $.newfileSaving = true;
            hubba.files.post({name:$.newfileName}).success(function(f){
                $.newfileSaving = false;
                $.showNewfileInput = false;

                $location.path('/hubba-admin/files/'+ f.id);
            }).error(function(){
                $.newfileSaving = false;
            });
        }
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
        hubba.files.del(file.name).success(function(){
            for ( var i = 0; i < hubba.files.cache.length; i++ ) {
                if (hubba.files.cache[i].name === file.name) {
                    hubba.files.cache.splice(i,1);
                    break;
                }
            }
            delete hubba.selectedfile;
        });
    };

    function selectFileFromRoute() {
        if (hubba.$route.params.id) {
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
    };
}]);

app.controller('body',['$scope', 'hubba', function($scope, hubba) {
    $scope.aceLoaded = function(_editor){
        // Options
        _editor.setShowPrintMargin(false);
    };
}]);

app.directive('hControllerCode',['hubba','$timeout',function(hubba, $timeout){
    return {
        replace: false,
        templateUrl: '/hubba-admin/partials/controllerCodeArea.html',
        link: function ($, element, attrs) {
            $.verb = attrs['hVerb'];
            $.code = hubba.selectedResource.configuration[$.verb];

            var first = true,
                controllerTimeout;

            function saveResource(){
                hubba.resources.put(hubba.selectedResource.id,hubba.selectedResource,function(r){
                    hubba.selectedResource = r;
                    $timeout(function(){
                        $.controllerSaving = false;
                    },100);
                });
            }

            $.updateControllerCode = function updateControllerCode(code,instant){
                $.controllerSaving = true;
                hubba.selectedResource.configuration[$.verb] = code;

                if (controllerTimeout){
                    $timeout.cancel(controllerTimeout);
                }

                if (instant){
                    saveResource();
                } else {
                    controllerTimeout = $timeout(function(){
                        saveResource();
                    },1000);
                }
            };
        }
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

    $.newSocketMethod = function newSocketMethodDef() {
        $.newSocketMethodName = '';
        $.showNewSocketMethodInput = true;
        // let angular do it's thing then set the element focus
        setTimeout(function(){
            document.getElementById('newSocketMethodInput').focus();
        });
    };

    function saveSocketMethodCB(){
        $.showNewSocketMethodInput = false;
    }

    $.saveNewSocketMethod = function saveNewSocketMethodDef(e) {
        if(e.keyCode === 13){
            hubba.selectedSocket.methods[$.newSocketMethodName.toString()] = '/* The code goes here buddy... */';

            hubba.sockets.put(hubba.selectedSocket)
                .success(function(){
                    saveSocketMethodCB();
                    $location.search({method: $.newSocketMethodName});
                })
                .error(function(){
                    saveSocketMethodCB();
                    delete hubba.selectedSocket.methods[$.newSocketMethodName.toString()];
                });
        }
    };

    $.deleteSocket = function deleteSocketDef(socket) {
        hubba.sockets.del(socket.name).success(function(){
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
            if (hubba.selectedSocket && hubba.$route.params.method) {
                if (hubba.$route.params.method in hubba.selectedSocket.methods) {
                    hubba.selectedSocketMethod = hubba.$route.params.method;
                } else {
                    hubba.errors.push(hubba.$route.params.method + ' is not a valid method for socket ' + hubba.selectedSocket.name + '.');

                }
            } else {
                hubba.selectedSocketMethod = 'default';
            }
        }
    }

}]);

/*
app.directive('hResourceTree',function(){
    return {
        replace: false,
        template: '<ul><li><div class="child"><button class="btn btn-link">/{{resources.name}}</button><br/><button class="btn btn-link" ng-click="resourceAddChild()">Add Child</button></div><ul><li ng-repeat="(key,child) in resources.children"><a href="/hubba-admin/resources/{{child.id}}" ng-click="showChildren = !showChildren;" class="child">/{{child.name}}<span class="glyphicon glyphicon-plus"></span></a><div ng-show="showChildren"><ul hubba-resource-child selected-resource="selectedResource" ng-model="child"></ul></div></li></ul>',
        link: function (scope, element, attrs) {
            scope.showChildren = false;
        }
    };
});

app.directive('hResourceChild',['$compile',function($compile){
    return {
        replace: false,
        link: function (scope, element, attrs) {
            scope.showChildren = false;
            if (scope.ngModel && scope.ngModel.children && Object.keys(scope.ngModel.children).length) {
                element.append('{{selectedResource.name}}<li ng-repeat="(key,child) in ngModel.children"><a href="/hubba-admin/resources/{{child.id}}" ng-click="showChildren = !showChildren;" class="child">/{{child.name}}</a><div ng-show="showChildren"><ul hubba-resource-child selected-resource="selectedResource" ng-model="child"></ul></div></li>');
                $compile(element.contents())(scope)
            }
        }
    };
}]);*/