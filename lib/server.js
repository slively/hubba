#!/usr/bin/env node
"use strict";

var assert = require('assert-plus'),
    fs = require('fs'),
    express = require('express.io'),
    HLogger = require('./hLogger').HLogger,
    HubbaClientFactory = require('./client/hClient').HubbaClientFactory,
    SocketRouter = require('./socket/socketRouter').SocketRouter,
    HubbaStore = require('./HubbaStore').HubbaStore,
    optimist = require('optimist'),
    cluster = require('cluster'),
    uuid = require('node-uuid'),
    ncp = require('ncp').ncp,
    options = optimist.usage('Run a Hubba web server.\n Usage: $0').options({
        help : {
            alias : 'h',
            describe : 'Show this help information.'
        },
        port: {
            alias : 'p',
            'default' : 8001,
            describe : 'The local port number where the development web server is to run (default: 8001).'
        },
        name: {
            alias : 'n',
            'default': 'hubba',
            describe: 'The name of the hubba project (will determine name of database and static file folder).'
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

    store.name = argv.name;

    var publicFolderPath = __dirname+'/public',
        staticFolderPath = publicFolderPath+'/'+argv.name;

    try {
        // create folder if it doesn't exist
        fs.mkdirSync(publicFolderPath);
    } catch(e){}

    var server = express(),
        logger = new HLogger({type:argv.logger, path:argv.loggerPath}),
        clientFactory = new HubbaClientFactory({server:server,logger:logger}),
        hStore = new HubbaStore(store),
        passport = require('passport'),
        BasicStrategy = require('passport-http').BasicStrategy,
        LocalStrategy = require('passport-local').Strategy,
        UserAPIController = require('./user/userAPIController').UserAPIController,
        usersController = new UserAPIController({ userStore: hStore.users });



    // initialize the express.io stuff for sockets
    server.http().io();
    var io = server.io;
    io.enable('browser client minification');
    io.enable('browser client gzip');
    io.set('resource','/sockets');



    // initialize passportjs stuff for authentication/authorization
    passport.use(new BasicStrategy(usersController.login));
    passport.use(new LocalStrategy(usersController.login));


    // Passport session setup.
    //   To support persistent login sessions, Passport needs to be able to
    //   serialize users into and deserialize users out of the session.  Typically,
    //   this will be as simple as storing the user ID when serializing, and finding
    //   the user by ID when deserializing.
    passport.serializeUser(function(user, done) {
        done(null, user.id);
    });

    passport.deserializeUser(function(id, done) {
        hStore.users.find(id, function(err,user) {
            done(err, user);
        });
    });



    // initialize express framework stuff
    server.use(express.compress());
    server.use(express.urlencoded());
    server.use(express.json());
    server.use(express.multipart());
    server.use(express.cookieParser());
    server.use(express.session({secret:uuid.v4(), key: 'hubba.sid'}));
    server.use(express.responseTime());
    server.use(passport.initialize());
    server.use(passport.session());
    server.disable('x-powered-by');
    server.disable('etag');
    server.use(function(req,res,next){
        res.setHeader('X-Powered-By', 'Hubba'); // because I'm vain?
        req.id = uuid.v4(); // used to trace a request through the Hubba framework for logging/debugging
        req.internal = false; // set to true when an internal Hubba request is made
        req.initial = true; // set to false for internal requests so we know the initiating web service call
        next();
    });



    /**
     *   hubba-admin pages
     **/
    var adminStaticServer = express.static(__dirname+'/hubba-admin');
    server.use('/hubba-admin', function(req,res,next){
        adminStaticServer(req,res,function(){
            req.url = '/';
            adminStaticServer(req,res,next);
        });
    });




    /**
     *  Hubba browser clients
     **/
    var clientStaticServer = express.static(__dirname+'/externalClients');
    server.use('/hubba/clients',clientStaticServer);




    /**
     * Hubba API Authentication
     **/

    server.post('/hubba/api/login/basic',passport.authenticate('basic', {session: false}), function(req,res){
        res.send(200,req.user);
    });

    server.post('/hubba/api/login',passport.authenticate('local'), function(req,res){
        res.send(200,req.user);
    });

    server.post('/hubba/api/logout', function(req, res){
        req.logout();
        res.send(200);
    });

    server.all('/hubba/api*',function(req,res,next){
        if (req.isAuthenticated() && req.user) {
            if (req.user.role === 'read-only' && !(req.method === 'GET' || req.method === 'OPTIONS')) {
                res.send(401, 'The read-only role cannot modify resources.');
            } else {
                next();
            }
        } else {
            res.send(401, 'Api endpoints all require authentication.');
        }
    });


    /**
     * Users Api
     **/

    server.get('/hubba/api/users',usersController.getAll);
    server.get('/hubba/api/users/:id',usersController.get);
    server.post('/hubba/api/users',usersController.post);
    server.put('/hubba/api/users/:id',usersController.put);
    server.patch('/hubba/api/users/:id',usersController.patch);
    server.del('/hubba/api/users/:id',usersController.del);



    /**
     * Services Api
     **/
    var ServiceList = require('./service/serviceList').ServiceList,
        ServiceAPIController = require('./service/serviceAPIController').ServiceAPIController,
        ServiceRouter = require('./service/serviceRouter').ServiceRouter,
        servicesRouter = new ServiceRouter({server:server, logger:logger, clientFactory:clientFactory}),
        services = new ServiceList({ store: hStore.services }),
        servicesController = new ServiceAPIController({ serviceList: services });


    services.on('add', function(s) {
        servicesRouter.updateRoute(s);
    }).on('update', function(s) {
        servicesRouter.updateRoute(s);
    }).on('remove', function(s) {
        servicesRouter.updateRoute(s);
    });

    server.get('/hubba/api/services',servicesController.getAll);
    server.get('/hubba/api/services/:id',servicesController.get);
    server.post('/hubba/api/services',servicesController.post);
    server.put('/hubba/api/services/:id',servicesController.put);
    server.patch('/hubba/api/services/:id',servicesController.patch);
    server.del('/hubba/api/services/:id',servicesController.del);



    /**
     * Service Types Api
     */

    var serviceTypesStaticServer = express.static(__dirname+'/../node_modules');

    server.get('/hubba/api/service_types',servicesController.getTypes);

    server.get('/hubba/api/service_types/:type/docs*',function(req,res) {

        req.url = req.url.replace('/hubba/api/service_types/'+req.params.type+'/docs','/hubba-adapter-'+req.params.type+'/hubba_docs');

        serviceTypesStaticServer(req,res,function(){
            res.send(404,'Uh Oh, this resource has no documentation. Tsk Tsk..');
        });
    });



    /**
     * Sockets Api
     **/
    var SocketList = require('./socket/socketList').SocketList,
        SocketAPIController = require('./socket/socketAPIController').SocketAPIController,
        socketRouter = new SocketRouter({server:server, clientFactory:clientFactory,logger:logger}),
        sockets = new SocketList({store: hStore.sockets}),
        socketsController = new SocketAPIController({socketList: sockets});

    sockets.on('add', function(s) {
        socketRouter.addRoute(s);
    }).on('update', function(s) {
        socketRouter.updateRoute(s);
    }).on('remove', function(s) {
        socketRouter.removeRoute(s);
    });

    server.get('/hubba/api/sockets',socketsController.getAll);
    server.get('/hubba/api/sockets/:id',socketsController.get);
    server.post('/hubba/api/sockets',socketsController.post);
    server.put('/hubba/api/sockets/:id',socketsController.put);
    server.patch('/hubba/api/sockets/:id',socketsController.patch);
    server.del('/hubba/api/sockets/:id',socketsController.del);



    /**
     * Files Api
     **/
    var FileList = require('./file/fileList').FileList,
        FileAPIController = require('./file/fileAPIController').FileAPIController,
        files = new FileList({store: hStore.files, rootDirectory: staticFolderPath}),
        filesController = new FileAPIController({ fileList: files });

    server.get('/hubba/api/files',filesController.getAll);
    server.get('/hubba/api/files/:id',filesController.get);
    server.post('/hubba/api/files',filesController.post);
    server.put('/hubba/api/files/renameFolder',filesController.renameFolder);
    server.put('/hubba/api/files/removeFolder',filesController.removeFolder);
    server.put('/hubba/api/files/:id',filesController.put);
    server.patch('/hubba/api/files/:id',filesController.patch);
    server.del('/hubba/api/files/:id',filesController.del);



    /**
     *  Logs Api
     **/
    server.get('/hubba/api/logs',function(req,res,next){
        try {
            logger.snapshot(function(log){
                res.json(log);
            });
        } catch(err) {
            err.status = 500;
            next(err);
        }
    });



    /**
     * Error handler
     */
    server.use(function serverErrorHandler(err,req,res,next){
        var e;

        if (err instanceof Error) {
            e = {
                status: err.status,
                message: err.message,
                stack: err.stack,
                error: true
            };

            res.send(e.status || 500,e);

            logger.log(e);
        } else {
            next();
        }
    });



    /**
     * Static file router
     **/
    var publicStaticServer = express.static(staticFolderPath);
    server.get(/^(?!\/api).*/i, publicStaticServer);


    // Start the server
    server.listen(port);
    logger.log("Hubba listening on port: " + port);


    /*

        TODO: Move this to a seperate testApp.js file

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

    if (argv.testServer){

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
            xml = '<definitions name="HelloService" targetNamespace="http://www.examples.com/wsdl/HelloService.wsdl" xmlns="http://schemas.xmlsoap.org/wsdl/" xmlns:soap="http://schemas.xmlsoap.org/wsdl/soap/" xmlns:tns="http://www.examples.com/wsdl/HelloService.wsdl" xmlns:xsd="http://www.w3.org/2001/XMLSchema"><message name="SayHelloRequest"><part name="firstName" type="xsd:string"/></message><message name="SayHelloResponse"><part name="greeting" type="xsd:string"/></message><portType name="Hello_PortType"><operation name="sayHello"><input message="tns:SayHelloRequest"/><output message="tns:SayHelloResponse"/></operation></portType><binding name="Hello_Binding" type="tns:Hello_PortType"><soap:binding style="rpc" transport="http://schemas.xmlsoap.org/soap/http"/><operation name="sayHello"><soap:operation soapAction="sayHello"/><input><soap:body encodingStyle="http://schemas.xmlsoap.org/soap/encoding/" namespace="urn:examples:helloservice" use="encoded"/></input><output><soap:body encodingStyle="http://schemas.xmlsoap.org/soap/encoding/" namespace="urn:examples:helloservice" use="encoded"/></output></operation></binding><service name="Hello_Service"><documentation>WSDL File for HelloService</documentation><port binding="tns:Hello_Binding" name="Hello_Port"><soap:address location="http://localhost:8082/wsdl"/></port></service></definitions>',
            soapServer = require('http').createServer(function(request,response) {
                response.end("404: Not Found: "+request.url)
            });

        soapServer.listen(8082);
        soap.listen(soapServer, '/wsdl', helloWorldService, xml);
        logger.log('Hubba running test server on port 8082.');
    }
    */
}


if (argv.help){
    options.showHelp();
} else {
    main(argv);
}
