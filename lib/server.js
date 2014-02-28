#!/usr/bin/env node

var assert = require('assert-plus'),
    fs = require('fs'),
    express = require('express.io'),
    ResourceTree = require('./resourceTree').ResourceTree,
    HLogger = require('./hLogger').HLogger,
    HClient = require('./client/hClient').HClient,
    DynamicRouter = require('./DynamicRouter').DynamicRouter,
    HubbaStores = require('./hubbaStores').HubbaStores,
    optimist = require('optimist'),
    cluster = require('cluster'),
    uuid = require('node-uuid'),
    DEFAULT_PORT = 8080,
    DEFAULT_STORE = 'file';

var options = optimist.usage('Run a Hubba web server.\n Usage: $0').options({
        help : {
            alias : 'h',
            describe : 'Show this help information.'
        },
        port: {
            alias : 'p',
            'default' : 8001,
            describe : 'The local port number where the development web server is to run (default: 8001).'
        },
        verbose : {
            alias : 'v',
            describe : 'Enable high verbosity console logging.',
            'default' : false,
            boolean : true
        },
        store : {
            alias : 's',
            'default' : 'file',
            describe: 'The type of storage mechanism: memory, file (default), or redis.'
        },
        redisPort : {
            alias : 'rp',
            'default' : 6379,
            describe: 'If a redis storage is selected this will be the port (default: 6379).'
        },
        redisHost : {
            alias : 'rh',
            'default' : '127.0.0.1',
            describe: 'If a redis storage is selected this will be the hostname (default: 127.0.0.1).'
        },
        redisPassword : {
            alias : 'rp',
            'default' : null,
            describe: 'If a redis storage is selected this will be the password (default: null).'
        },
        logger : {
            alias : 'l',
            'default' : 'file',
            describe: 'Define where logging should be sent. Options are \'off\', \'console\' (uses gue.log), \'file\' (logged to a daily rolling file), or \'service\' which is an api endpoint. When an api endpoint is selected every logging request will send a POST to the configured endpoint and the body will be loggers\' contents'
        },
        loggerPath : {
            alias : 'lp',
            'default' : __dirname+'/../logs',
            describe : 'Path where logging information will be sent. If logger is set to \'file\' then this should be a file path, if logger is set to \'service\' it should be the web service address. If no hostname is specified, the address is assumed to be an internal Hubba web service (ex. /api/myLoggerController --or-- http://someaddress.com/logger).'
        },
        testServer: {
            alias: 'test-server',
            describe: 'Start Hubba in test mode. Extra testing routes will be created and the following parameters will be set: port = 8081, store = memory, verbose = true'
        }
    }),
    argv = options.argv;

function main(argv){

    var store,
        port = argv.port;

    if (argv.testServer){
        store = { type: 'memory' };
        port = 8081;
    } else if (argv.store == 'redis'){
        store = {
            type: argv.store,
            host: argv.redisHost,
            port: argv.redisPort,
            password: argv.redisPassword
        };
    } else {
        store = { type: argv.store };
    }

    var server = express(),
        adminStaticServer = express.static(__dirname+'/hubba-admin'),
        publicStaticServer = express.static(__dirname+'/../public'),
        clientStaticServer = express.static(__dirname+'/externalClients'),
        resourceTypeDocStaticServers = {},
        tree = new ResourceTree({store: store}),
        logger = new HLogger({type:argv.logger, path:argv.loggerPath}),
        hClient = new HClient({logger:logger}),
        dRouter = new DynamicRouter({server:server,internalClient: hClient.internalClient, logger:logger}),
        hStore = new HubbaStores(store);

    server.http().io();
    var io = server.io;

    io.enable('browser client minification');
    io.enable('browser client gzip');
    io.set('resource','/sockets');

    server.use(express.compress());
    server.use(express.urlencoded());
    server.use(express.json());
    server.use(express.multipart());
    server.use(express.cookieParser());
    server.use(express.session({secret:uuid.v4(), key: 'hubba.sid'}));
    server.use(express.responseTime());
    server.disable('x-powered-by');
    server.disable('etag');


    server.use(function(req,res,next){
        res.setHeader('X-Powered-By', 'Hubba');
        next();
    });

    tree.on('update:path',function(o){
        var regexp = dRouter.updateRoute(o);
        hClient.updateRoute(o,regexp);
    });
    tree.on('remove:path',function(o){
        hClient.deleteRoute(o);
        dRouter.updateRoute({id: o.id, path: undefined});
    });

    // Setup static server for admin pages
    server.use('/hubba-admin', function(req,res,next){
        adminStaticServer(req,res,function(){
            req.url = '/';
            adminStaticServer(req,res,next);
        });
    });

    // Setup static servers for  each of the resource type documentation folders
    tree.getTypes(function(err,types){
        if(err) {
            logger.log('Error getting loaded resource types:',err);
            return;
        }

        types.forEach(function(type){
            resourceTypeDocStaticServers[type.name] = {
                server: express.static(type.filePath.replace('index.js','')),
                path: type.filePath.replace('index.js','docs')
            }
        });

        server.get('/hubba/api/resource_types/:type/docs*',function(req,res,next){
            // spoof the url for the static resource server
            req.url = req.url.replace('/hubba/api/resource_types/'+req.params.type+'','');
            resourceTypeDocStaticServers[req.params.type].server(req,res,function(){
                res.send(200,'Uh Oh, this resource has no documentation. Tsk Tsk..');
            });
        });
    });

    server.use('/hubba/clients',clientStaticServer);

    server.get('/hubba/api/resources',function(req,res){
        if(req.query.tree == 'true'){
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
                logger.log('GET error: ' + err + ':\n' + err.stack + '\n' + 'Params: ' + JSON.stringify(req.params) + '\n' + 'Body: ' + JSON.stringify(req.body) + '\n\n');
                res.send(400,err.message || err);
            } else {
                res.send(200,resource);
            }
        });
    });

    server.get('/hubba/api/resources/:id',function(req,res){

        tree.find(parseInt(req.params.id),function(err,resource){
            if(err) {
                logger.log('GET error: ' + err + ':\n' + err.stack + '\n' + 'Params: ' + JSON.stringify(req.params) + '\n' + 'Body: ' + JSON.stringify(req.body) + '\n\n');
                res.send(400,err.message || err);
            } else {
                res.send(200,resource);
            }
        });
    });

    server.put('/hubba/api/resources/:id',function(req,res){

        tree.update(parseInt(req.params.id),req.body,function(err,resource){
            if(err) {
                logger.log('PUT error: ' + err + ':\n' + err.stack + '\n' + 'Params: ' + JSON.stringify(req.params) + '\n' + 'Body: ' + JSON.stringify(req.body) + '\n\n');
                res.send(400,err.message || err);
            } else {
                res.send(200,resource);
            }
        });
    });

    server.patch('/hubba/api/resources/:id',function(req,res){
        tree.update(parseInt(req.params.id),req.body,function(err,resource){
            if(err) {
                logger.log('PATCH error: ' + err + ':\n' + err.stack + '\n' + 'Params: ' + JSON.stringify(req.params) + '\n' + 'Body: ' + JSON.stringify(req.body) + '\n\n');
                res.send(400,err.message || err);
            } else {
                res.send(200,resource);
            }
        });
    });

    server.post('/hubba/api/resources',function(req,res){
        tree.add(req.body,function(err,resource){
            if(err) {
                logger.log('POST error: ' + err + ':\n' + err.stack + '\n' + 'Params: ' + JSON.stringify(req.params) + '\n' + 'Body: ' + JSON.stringify(req.body) + '\n\n');
                res.send(400,err.message || err);
            } else {
                res.send(200,resource);
            }
        });
    });

    server.del('/hubba/api/resources/:id',function(req,res){
        tree.remove(parseInt(req.params.id),function(err){
            if(err) {
                logger.log('DELETE error: ' + err + ':\n' + err.stack + '\n' + 'Params: ' + JSON.stringify(req.params) + '\n' + 'Body: ' + JSON.stringify(req.body) + '\n\n');
                res.send(400,err.message || err);
            } else {
                res.send(200);
            }
        });
    });

    server.get('/hubba/api/resource_types',function(req,res){
        tree.getTypes(function(err,types){
            if(err) throw err;

            if (req.query.object == 'true'){
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

    server.get('/hubba/api/sockets', function(req,res){
        hStore.sockets.findAll(function(err,result){
            if (err){
                res.send(400,err.message);
            } else {
                res.json(200,result);
            }
        });
    });

    server.get('/hubba/api/sockets/:name', function(req,res){
        hStore.sockets.find(req.params.name,function(err,result){
            if (err){
                res.send(404,err.message);
            } else {
                res.json(200,result);
            }
        });
    });

    server.post('/hubba/api/sockets', function(req,res){
        hStore.sockets.find(req.body,function(err,result){
            if (err){
                res.send(404,err);
            } else {
                res.json(200,result);
            }
        });
    });

    server.put('/hubba/api/sockets/:id', function(req,res){

    });

    server.patch('/hubba/api/sockets/:id', function(req,res){

    });

    server.del('/hubba/api/sockets/:id', function(req,res){

    });


    server.get(/^(?!\/api).*/i, publicStaticServer);

    server.listen(port);
    logger.log("Hubba listening on port: " + port);

    if (argv.testServer){
        // REST test resource
        function restHandler(req,res){
            res.send({
                headers: req.headers || {},
                query: req.query || {},
                params: req.params || {},
                body: req.body || {},
                path: req.path || ''
            });
        }
        server.get('/api-test/rest*',restHandler);
        server.post('/api-test/rest*',restHandler);
        server.put('/api-test/rest*',restHandler);
        server.patch('/api-test/rest*',restHandler);
        server.del('/api-test/rest*',restHandler)

        // SOAP test resource
        var soap = require('soap'),
            helloWorldService = {
                "Hello_Service": {
                    "Hello_Port": {
                        "sayHello": function(args, cb){
                            cb({greeting: "Hello " + args.firstName + "!"});
                        }
                    }
                }
            },
            xml = '<definitions name="HelloService" targetNamespace="http://www.examples.com/wsdl/HelloService.wsdl" xmlns="http://schemas.xmlsoap.org/wsdl/" xmlns:soap="http://schemas.xmlsoap.org/wsdl/soap/" xmlns:tns="http://www.examples.com/wsdl/HelloService.wsdl" xmlns:xsd="http://www.w3.org/2001/XMLSchema"><message name="SayHelloRequest"><part name="firstName" type="xsd:string"/></message><message name="SayHelloResponse"><part name="greeting" type="xsd:string"/></message><portType name="Hello_PortType"><operation name="sayHello"><input message="tns:SayHelloRequest"/><output message="tns:SayHelloResponse"/></operation></portType><binding name="Hello_Binding" type="tns:Hello_PortType"><soap:binding style="rpc" transport="http://schemas.xmlsoap.org/soap/http"/><operation name="sayHello"><soap:operation soapAction="sayHello"/><input><soap:body encodingStyle="http://schemas.xmlsoap.org/soap/encoding/" namespace="urn:examples:helloservice" use="encoded"/></input><output><soap:body encodingStyle="http://schemas.xmlsoap.org/soap/encoding/" namespace="urn:examples:helloservice" use="encoded"/></output></operation></binding><service name="Hello_Service"><documentation>WSDL File for HelloService</documentation><port binding="tns:Hello_Binding" name="Hello_Port"><soap:address location="http://localhost:8082/wsdl"/></port></service></definitions>';

        soapServer = require('http').createServer(function(request,response) {
            response.end("404: Not Found: "+request.url)
        });

        soapServer.listen(8082);
        soap.listen(soapServer, '/wsdl', helloWorldService, xml);
        logger.log('Hubba running test server on port 8082.');
    }
};


if (argv.help){
    options.showHelp();
} else {
    main(argv);
}