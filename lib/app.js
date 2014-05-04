/**
 * This starts a hubba server for a specified hubba app.
 *
 * Input options:
 *      path: path to hubba app to be started.
 *
 */

var assert = require('assert-plus'),
    fs = require('fs'),
    express = require('express.io'),
    passport = require('passport'),
    BasicStrategy = require('passport-http').BasicStrategy,
    LocalStrategy = require('passport-local').Strategy,
    HLogger = require('./hLogger').HLogger,
    HubbaClientFactory = require('./client/hClient').HubbaClientFactory,
    SocketRouter = require('./socket/socketRouter').SocketRouter,
    HubbaStore = require('./hubbaStore'),
    optimist = require('optimist'),
    cluster = require('cluster'),
    uuid = require('node-uuid'),
    UserAPIController = require('./user/userAPIController').UserAPIController,
    options = optimist.usage('Run a Hubba app.\n Usage: $0').options({
        help : {
            alias : 'h',
            describe : 'Show this help information.'
        },
        dir: {
            alias : 'd',
            describe : 'The directory that contains the Hubba app.',
            demand: true
        },
        port: {
            alias : 'p',
            describe : 'The port to start the app.',
            demand: false
        }
    });

function HubbaApp(opts) {
    var o = opts || {},
        appRoot = process.cwd(),
        appName = appRoot.split('/')[appRoot.split('/').length-1],
        appLogs = appRoot + '/logs',
        appPublicFolder = appRoot + '/public',
        appNodeModulesFolder = appRoot + '/node_modules';

    // check if app already exists
    // if not, create all of the necessary folders
    if (!fs.existsSync(appRoot)) {
        console.log('Path ' + appRoot + ' does not exist, aborting.');
        return;
    }

    if (!fs.existsSync(appPublicFolder)) {
        try {
            fs.mkdirSync(appPublicFolder);
        } catch(e) {
            console.log("Error creating directory: " + appPublicFolder);
            console.log(e.stack);
        }
    }

    if (!fs.existsSync(appNodeModulesFolder)) {
        try {
            fs.mkdirSync(appNodeModulesFolder);
        } catch(e) {
            console.log("Error creating directory: " + appNodeModulesFolder);
            console.log(e.stack);
        }
    }

    // connect to sqlite
    HubbaStore.connect({type: 'file',name: appName, path: appRoot}, function(hStore){

        /*
            TODO: server configuration items to be pulled from sqlite:
                port
                logger options (file, web service, ...)
                session secret (will be generated and stored if it doesn't exist)
                environment pass phrase (optional)
                    if required all sqlite stuff is encrypted
         */

        var server = express(),
            logger = new HLogger({type:'file', path: appLogs}),
            clientFactory = new HubbaClientFactory({server:server,logger:logger}),
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
        passport.serializeUser(function(user, done) { done(null, user.id); });
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

        server.get('/hubba/api/me',function(req,res){
            res.send(200,req.user);
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

        var serviceTypesStaticServer = express.static(appNodeModulesFolder);

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
            files = new FileList({store: hStore.files, rootDirectory: appPublicFolder}),
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

        var publicStaticServer = express.static(appPublicFolder);
        server.get(/^(?!\/api).*/i, publicStaticServer);


        // Start the server
        server.listen(o.port || 8001);
        logger.log("Hubba listening on port: " + (o.port || 8001) );

    });
}




if (options.argv.help){
    options.showHelp();
} else {
    HubbaApp({
        dir: options.argv.dir.trim(),
        port: parseInt(options.argv.port || 8001)
    });
}