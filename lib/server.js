#!/usr/bin/env node

var assert = require('assert-plus'),
    fs = require('fs'),
    restify = require('restify'),
    ResourceTree = require('./resourceTree').ResourceTree,
    HClient = require('./client/hClient').HClient,
    optimist = require('optimist'),
    cluster = require('cluster'),
    static = require('node-static'),
    DEFAULT_PORT = 8080,
    DEFAULT_STORE = 'file';

var options = optimist.usage('Run a huba web server.\n Usage: $0').options({
                port: {
                    alias : 'port',
                    'default' : 8001,
                    describe : 'The local port number where the development web server is to run (default: 8001).'
                },
                verbose : {
                    alias : 'verbose',
                    describe : 'Enable high verbosity console logging.',
                    'default' : false,
                    boolean : true
                },
                store : {
                    alias : 'store',
                    'default' : 'file',
                    describe: 'The type of storage mechanism: memory, file (default), or redis.'
                },

                redisPort : {
                    alias : 'redis-port',
                    'default' : 6379,
                    describe: 'If a redis storage is selected this will be the port (default: 6379).'
                },
                redisHost : {
                    alias : 'redis-host',
                    'default' : '127.0.0.1',
                    describe: 'If a redis storage is selected this will be the hostname (default: 127.0.0.1).'
                },
                redisPassword : {
                    alias : 'redis-password',
                    'default' : null,
                    describe: 'If a redis storage is selected this will be the password (default: null).'
                },
                help : {
                    alias : 'h',
                    describe : 'Show this help information.'
                }
            }),
    argv = options.argv,
    treeOptions,
    tree;

function main(argv){

    if (argv.store[0] == 'redis'){
        store = {
            type: argv.store[0],
            host: argv.redisHost,
            port: argv.redisPort,
            password: argv.redisPassword
        };
    } else {
        store = { type: argv.store[0] };
    }


    var server = restify.createServer(),
        adminStaticServer = restify.serveStatic({
            directory: __dirname+'/hubba-admin',
            default: 'index.html'
        }),
        publicStaticServer = restify.serveStatic({
            directory: __dirname+'/../../public',
            default: 'index.html'
        }),
        tree = new ResourceTree({store: store}),
        hClient = new HClient();

    server.pre(restify.pre.sanitizePath());
    server.use(restify.acceptParser(server.acceptable));
    server.use(restify.authorizationParser());
    server.use(restify.dateParser());
    server.use(restify.queryParser());
    server.use(restify.jsonp());
    server.use(restify.gzipResponse());
    server.use(restify.bodyParser({ mapParams: false }));


    /*tree.getRoutes(function(err,results){
        results.forEach(function(o){
            updateSeverRoute(server,o);
        });
    });*/
    tree.on('update:path',function(o){
        hClient.updateRoute(o);
        updateSeverRoute(server,o,hClient.internalClient);
    });
    tree.on('remove:path',function(o){
        hClient.deleteRoute(o);
        deleteServerRoute(server,o);
    });
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
    server.use(restify.conditionalRequest());

    server.get('/hubba-admin(.*)',function(req,res){
        console.log(staticServer);
        staticServer.serve(req, res, function (err, result) {
            if (err) { // There was an error serving the file
                console.log("Error serving " + req.url + " - " + err.message);

                // Respond to the client
                res.writeHead(err.status, err.headers);
                res.end();
            }
        });
    });*/

    server.get('/hubba-admin(.*)', function(req,res,next){
        adminStaticServer(req,res,function(err){
            if(err){
                req._path = '/hubba-admin';
                adminStaticServer(req,res,next);
            }
        });
    });

    server.get('/hubba/api.js',function(req,res){
        res.send(200,"window.hubba = {};");
    });

    server.get('/hubba/api/resources',function(req,res){

        if(req.params.tree == 'true'){
            tree.getTree(function(err,resources){
                if(err) throw err;
                res.send(200,resources);
            });
        } else {
            tree.findAll(function(err,resources){
                if(err) throw err;
                res.send(200,resources);
            });
        }
    });

    server.get('/hubba/api/resources/root',function(req,res){

        tree.getRoot(function(err,resource){
            if(err) {
                console.log('GET error: ' + err + ':\n' + err.stack + '\n' + 'Params: ' + JSON.stringify(req.params) + '\n' + 'Body: ' + JSON.stringify(req.body) + '\n\n');
                res.send(400,new Error(err));
            } else {
                res.send(200,resource);
            }
        });
    });

    server.get('/hubba/api/resources/:id',function(req,res){

        tree.find(parseInt(req.params.id),function(err,resource){
            if(err) {
                console.log('GET error: ' + err + ':\n' + err.stack + '\n' + 'Params: ' + JSON.stringify(req.params) + '\n' + 'Body: ' + JSON.stringify(req.body) + '\n\n');
                res.send(400,new Error(err));
            } else {
                res.send(200,resource);
            }
        });
    });

    server.put('/hubba/api/resources/:id',function(req,res){

        tree.update(parseInt(req.params.id),req.body,function(err,resource){
            if(err) {
                console.log('PUT error: ' + err + ':\n' + err.stack + '\n' + 'Params: ' + JSON.stringify(req.params) + '\n' + 'Body: ' + JSON.stringify(req.body) + '\n\n');
                res.send(400,new Error(err));
            } else {
                res.send(200,resource);
            }
        });

        /*try{
            res.send(200,resource.findById(req.params.id).update(req.body).toJson({includeChildren: req.query.include_children === 'true'}));
        } catch(e){
            console.log(e.stack);

            var c = 400 || e.code;
            res.send(c,e.message);
        }*/
    });

    server.patch('/hubba/api/resources/:id',function(req,res){
        tree.update(parseInt(req.params.id),req.body,function(err,resource){
            if(err) {
                console.log('PATCH error: ' + err + ':\n' + err.stack + '\n' + 'Params: ' + JSON.stringify(req.params) + '\n' + 'Body: ' + JSON.stringify(req.body) + '\n\n');
                res.send(400,new Error(err));
            } else {
                res.send(200,resource);
            }
        });

        /*try{
            res.send(200,resource.findById(req.params.id).update(req.body).toJson({includeChildren: req.query.include_children === 'true'}));
        } catch(e){
            console.log(e.stack);

            var c = 400 || e.code;
            res.send(c,e.message);
        }*/
    });

    server.post('/hubba/api/resources',function(req,res){

        tree.add(req.body,function(err,resource){
            if(err) {
                console.log('POST error: ' + err + ':\n' + err.stack + '\n' + 'Params: ' + JSON.stringify(req.params) + '\n' + 'Body: ' + JSON.stringify(req.body) + '\n\n');
                res.send(400,new Error(err));
            } else {
                res.send(200,resource);
            }
        });
        /*try {
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
        }*/
    });

    server.del('/hubba/api/resources/:id',function(req,res){
        tree.remove(parseInt(req.params.id),function(err){
            if(err) {
                console.log('DELETE error: ' + err + ':\n' + err.stack + '\n' + 'Params: ' + JSON.stringify(req.params) + '\n' + 'Body: ' + JSON.stringify(req.body) + '\n\n');
                res.send(400,new Error(err));
            } else {
                res.send(200);
            }
        });
        /*
        try {
            resource.findById(req.params.id).del();
            res.send(200);
        } catch(e){
            var c = 404 || e.code;
            res.send(c,e.message);
        }
        */
    });

    server.get('/hubba/api/resource_types',function(req,res){
        tree.getTypes(function(err,types){
            if(err) throw err;

            if (req.params.object == 'true'){
                var obj = {};
                types.forEach(function(type){
                    obj[type.name] = type;
                });
                res.send(200,obj);
            } else {
                res.send(200,types);
            }
        });
    });

    server.get(/^\/(?!api).*/, publicStaticServer);

    server.listen(argv.port[0]);
    console.log("Hubba listening on port: " + argv.port[0]);
};

function deleteServerRoute(Server, o){

    if (Server.routes['get'+o.id]){
        Server.rm('get'+o.id);
        Server.rm('post'+o.id);
        Server.rm('put'+o.id);
        Server.rm('patch'+o.id);
        Server.rm('del'+o.id);
    }
};

function updateSeverRoute(Server, o,internalClient){

    deleteServerRoute(Server,o);

    Server.get({
        name:'get'+o.id,
        path:o.path
    }, function(req,res){
        try {
            o.http.GET(req,res,internalClient);
        } catch(err){
            console.log('GET error: ' + err + ':\n' + err.stack + '\n' + 'Params: ' + JSON.stringify(req.params) + '\n' + 'Body: ' + JSON.stringify(req.body) + '\n\n');
            if(!res.headersSent){
                res.send(500,err);
            }
        }
    });

    Server.post({
        name:'post'+o.id,
        path: o.path
    },o.http.POST);

    Server.put({
        name:'put'+o.id,
        path:o.path
    },o.http.PUT);

    Server.patch({
        name:'patch'+o.id,
        path:o.path
    },o.http.PATCH);

    Server.del({
        name:'del'+o.id,
        path:o.path
    },o.http.DELETE);
};

if (argv.help){
    options.showHelp();
} else {
    main(argv);
}