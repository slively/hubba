/**
 * This starts a hubba app for a specified hubba app.
 *
 * Input options:
 *      path: path to hubba app to be started.
 *
 */

var assert = require('assert-plus'),
    fs = require('fs'),
    express = require('express.io'),
    passport = require('passport'),
    SQLiteStore = require('connect-sqlite3')(express),
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
            TODO: app configuration items to be pulled from sqlite:
                port
                logger options (file, web service, ...)
                session secret (will be generated and stored if it doesn't exist)
                environment pass phrase (optional)
                    if required all sqlite stuff is encrypted
         */

        var app = express(),
            logger = new HLogger({type:'file', path: appLogs}),
            clientFactory = new HubbaClientFactory({server:app,logger:logger}),
            usersController = new UserAPIController({ userStore: hStore.users });


        // initialize the express.io stuff for sockets
        app.http().io();
        var io = app.io;
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
        app.use(express.compress());
        app.use(express.urlencoded());
        app.use(express.json());
        app.use(express.multipart());
        app.use(express.cookieParser());
        app.use(express.session({
            store: new SQLiteStore({db: appName, dir: appRoot}),
            secret: 'your secret', // TODO: a real secrete would be good...
            key: 'hubba.sid',
            cookie: { maxAge: 7 * 24 * 60 * 60 * 1000 } // 1 week
        }));
        app.use(express.responseTime());
        app.use(passport.initialize());
        app.use(passport.session());
        app.disable('x-powered-by');
        app.disable('etag');
        app.use(function(req,res,next){
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
        app.use('/hubba-admin', function(req,res,next){
            adminStaticServer(req,res,function(){
                req.url = '/';
                adminStaticServer(req,res,next);
            });
        });




        /**
         *  Hubba browser clients
         **/

        var clientStaticServer = express.static(__dirname+'/externalClients');
        app.use('/hubba/clients',clientStaticServer);




        /**
         * Hubba API Authentication
         **/

        app.post('/hubba/api/login/basic',passport.authenticate('basic', {session: false}), function(req,res){
            res.send(200,req.user);
        });

        app.post('/hubba/api/login',passport.authenticate('local'), function(req,res){
            res.send(200,req.user);
        });

        app.post('/hubba/api/logout', function(req, res){
            req.logout();
            res.send(200);
        });

        app.all('/hubba/api*',function(req,res,next){
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

        app.get('/hubba/api/me',function(req,res){
            res.send(200,req.user);
        });



        /**
         * Users API
         **/

        app.get('/hubba/api/users',usersController.getAll);
        app.get('/hubba/api/users/:id',usersController.get);
        app.post('/hubba/api/users',usersController.post);
        app.put('/hubba/api/users/:id',usersController.put);
        app.patch('/hubba/api/users/:id',usersController.patch);
        app.del('/hubba/api/users/:id',usersController.del);



        /**
         * Services API
         **/

        var ServiceList = require('./service/serviceList').ServiceList,
            ServiceAPIController = require('./service/serviceAPIController').ServiceAPIController,
            ServiceRouter = require('./service/serviceRouter').ServiceRouter,
            servicesRouter = new ServiceRouter({server:app, logger:logger, clientFactory:clientFactory}),
            services = new ServiceList({ store: hStore.services }),
            servicesController = new ServiceAPIController({ serviceList: services });


        services.on('add', function(s) {
            servicesRouter.updateRoute(s);
        }).on('update', function(s) {
                servicesRouter.updateRoute(s);
            }).on('remove', function(s) {
                servicesRouter.updateRoute(s);
            });

        app.get('/hubba/api/services',servicesController.getAll);
        app.get('/hubba/api/services/:id',servicesController.get);
        app.post('/hubba/api/services',servicesController.post);
        app.put('/hubba/api/services/:id',servicesController.put);
        app.patch('/hubba/api/services/:id',servicesController.patch);
        app.del('/hubba/api/services/:id',servicesController.del);



        /**
         * Service Types API
         */

        var serviceTypesStaticServer = express.static(appNodeModulesFolder);

        app.get('/hubba/api/service_types',servicesController.getTypes);

        app.get('/hubba/api/service_types/:type/docs*',function(req,res) {

            req.url = req.url.replace('/hubba/api/service_types/'+req.params.type+'/docs','/hubba-adapter-'+req.params.type+'/hubba_docs');

            serviceTypesStaticServer(req,res,function(){
                res.send(404,'Uh Oh, this resource has no documentation. Tsk Tsk..');
            });
        });



        /**
         * Sockets API
         **/

        var SocketList = require('./socket/socketList').SocketList,
            SocketAPIController = require('./socket/socketAPIController').SocketAPIController,
            socketRouter = new SocketRouter({server:app, clientFactory:clientFactory,logger:logger}),
            sockets = new SocketList({store: hStore.sockets}),
            socketsController = new SocketAPIController({socketList: sockets});

        sockets.on('add', function(s) {
            socketRouter.addRoute(s);
        }).on('update', function(s) {
                socketRouter.updateRoute(s);
            }).on('remove', function(s) {
                socketRouter.removeRoute(s);
            });

        app.get('/hubba/api/sockets',socketsController.getAll);
        app.get('/hubba/api/sockets/:id',socketsController.get);
        app.post('/hubba/api/sockets',socketsController.post);
        app.put('/hubba/api/sockets/:id',socketsController.put);
        app.patch('/hubba/api/sockets/:id',socketsController.patch);
        app.del('/hubba/api/sockets/:id',socketsController.del);



        /**
         * Authentication Strategies API
         **/

        var AuthStrategyList = require('./authStrategy/authStrategyList').AuthStrategyList,
            AuthStrategyAPIController = require('./authStrategy/authStrategyAPIController').AuthStrategyAPIController,
            strategies = new AuthStrategyList({ store: hStore.authStrategies }),
            strategiesController = new AuthStrategyAPIController({ AuthStrategyList: strategies });

        app.get('/hubba/api/auth-strategies',strategiesController.getAll);
        app.get('/hubba/api/auth-strategies/:id',strategiesController.get);
        app.post('/hubba/api/auth-strategies',strategiesController.post);
        app.put('/hubba/api/auth-strategies/:id',strategiesController.put);
        app.patch('/hubba/api/auth-strategies/:id',strategiesController.patch);
        app.del('/hubba/api/auth-strategies/:id',strategiesController.del);



        /**
         * Files API
         **/

        var FileList = require('./file/fileList').FileList,
            FileAPIController = require('./file/fileAPIController').FileAPIController,
            files = new FileList({store: hStore.files, rootDirectory: appPublicFolder}),
            filesController = new FileAPIController({ fileList: files });

        app.get('/hubba/api/files',filesController.getAll);
        app.get('/hubba/api/files/:id',filesController.get);
        app.post('/hubba/api/files',filesController.post);
        app.put('/hubba/api/files/renameFolder',filesController.renameFolder);
        app.put('/hubba/api/files/removeFolder',filesController.removeFolder);
        app.put('/hubba/api/files/:id',filesController.put);
        app.patch('/hubba/api/files/:id',filesController.patch);
        app.del('/hubba/api/files/:id',filesController.del);



        /**
         *  Logs API
         **/

        app.get('/hubba/api/logs',function(req,res,next){
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

        app.use(function serverErrorHandler(err,req,res,next){
            var e;
            if (err instanceof Error || Object.prototype.toString.call(err) === '[object Error]') {
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
        app.get(/^(?!\/api).*/i, publicStaticServer);


        // Start the app
        app.listen(o.port || 8001);
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