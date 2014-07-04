/**
 * This starts a hubba app for a specified hubba app.
 */

var assert = require('assert-plus'),
    fs = require('fs'),
    optimist = require('optimist'),
    options = optimist.usage('Run a Hubba app.\n Usage: $0').options({
        help : {
            alias : 'h',
            describe : 'Show this help information.'
        },
        dir: {
            alias : 'd',
            describe : 'The directory that contains the Hubba app.',
            demand: false
        }
    });

function HubbaApp(opts) {
    var o = opts || {},
        appRoot = o.dir || process.cwd(),
        appName = appRoot.split('/')[appRoot.split('/').length-1],
        appLogs = appRoot + '/logs',
        appPublicFolder = appRoot + '/public',
        appNodeModulesFolder = appRoot + '/node_modules',
        HubbaStore = require('./hubbaStore');



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

        var ServerConfigurator = require('./serverConfiguration/serverConfigurator').ServerConfigurator,
            serverConfiguration = new ServerConfigurator({ store: hStore.serverConfigurations });

        serverConfiguration.findAll(function(err, serverConfigurationItems) {

            var serverPort = parseInt(serverConfigurationItems.PORT),
                express = require('express.io'),
                Passport = require('passport').Passport,
                hubbaPassport = new Passport(),
                appPassport = new Passport(),
                SQLiteStore = require('connect-sqlite3')(express),
                BasicStrategy = require('passport-http').BasicStrategy,
                LocalStrategy = require('passport-local').Strategy,
                HLogger = require('./hLogger').HLogger,
                HubbaClientFactory = require('./client/hClient').HubbaClientFactory,
                cluster = require('cluster'),
                uuid = require('node-uuid'),
                UserAPIController = require('./user/userAPIController').UserAPIController,
                app = express(),
                logger = new HLogger({type: 'file', path: appLogs}),
                clientFactory = new HubbaClientFactory({server: app, logger: logger}),
                hubbaUsersController = new UserAPIController({ userStore: hStore.users }),
                sessionStore = new SQLiteStore({db: appName, dir: appRoot}); // TODO pull configuration from DB


            // initialize the express.io stuff for sockets
            app.http().io();
            var io = app.io;
            io.enable('browser client minification');
            io.enable('browser client gzip');
            io.set('resource', '/sockets');


            // initialize passportjs stuff for authentication/authorization
            hubbaPassport.use('hubbaBasic', new BasicStrategy(hubbaUsersController.login));
            hubbaPassport.use('hubbaLocal', new LocalStrategy(hubbaUsersController.login));


            // Passport session setup.
            hubbaPassport.serializeUser(function (user, done) {
                done(null, {
                    id: user.id
                });
            });
            hubbaPassport.deserializeUser(function (sessionData, done) {
                hStore.users.find(sessionData.id, function (err, user) {
                    done(err, user);
                });
            });


            var hubbaSessions = express.session({
                    store: sessionStore,
                    secret: 'your secret', // TODO: a real secret would be good...
                    key: 'hubba.sid',
                    cookie: {
                        path: '/hubba/api',
                        maxAge: 24 * 60 * 60 * 1000 // 1 day
                    }
                }), appSessions = express.session({
                    store: sessionStore,
                    secret: serverConfigurationItems.SESSION_SECRET,
                    key: 'sid',
                    cookie: {
                        maxAge: parseInt(serverConfigurationItems.SESSION_MAX_AGE)
                    }
                }),
                hubbaPassportMiddleware = hubbaPassport.initialize(),
                hubbaPassportSessionMiddlware = hubbaPassport.session(),
                appPassportMiddleware = appPassport.initialize(),
                appPassportSessionMiddlware = appPassport.session();

            // initialize express framework stuff
            app.use(express.compress());
            app.use(express.urlencoded());
            app.use(express.json());
            app.use(express.multipart());
            app.use(express.cookieParser());
            app.disable('x-powered-by');
            app.disable('etag');
            app.use(function (req, res, next) {
                res.setHeader('X-Powered-By', 'Hubba');
                req.id = uuid.v4(); // used to trace a request through the Hubba framework for logging/debugging
                req.internal = false; // set to true when an internal Hubba request is made
                req.initial = true; // set to false for internal requests so we know the initiating web service call
                next();
            });
            app.use(express.responseTime());

            app.use('/hubba/api',hubbaSessions);
            app.use('/hubba/api',hubbaPassportMiddleware);
            app.use('/hubba/api',hubbaPassportSessionMiddlware);

            app.use('/api',appSessions);
            app.use('/api',appPassportMiddleware);
            app.use('/api',appPassportSessionMiddlware);

            /**
             *  hubba-admin pages
             **/
            var adminStaticServer = express.static(__dirname + '/hubba-admin');
            app.use('/hubba-admin', function (req, res, next) {
                adminStaticServer(req, res, function () {
                    req.url = '/';
                    adminStaticServer(req, res, next);
                });
            });


            /**
             *  Hubba browser clients
             **/

            var clientStaticServer = express.static(__dirname + '/externalClients');
            app.use('/hubba/clients', clientStaticServer);


            /**
             * Hubba API Authentication
             **/

            app.post('/hubba/api/login/basic', hubbaPassport.authenticate('hubbaBasic', {session: false}), function (req, res) {
                res.send(200);
            });

            app.post('/hubba/api/login', hubbaPassport.authenticate('hubbaLocal'), function (req, res) {
                res.send(200);
            });

            app.post('/hubba/api/logout', function (req, res) {
                req.logout();
                res.send(200);
            });

            app.all('/hubba/api*', function (req, res, next) {
                if (req.isAuthenticated()) {
                    if (req.user.role === 'read-only' && !(req.method === 'GET' || req.method === 'OPTIONS')) {
                        res.send(401, 'The read-only role cannot modify resources.');
                    } else {
                        next();
                    }
                } else {
                    res.send(401, 'Api endpoints all require authentication.');
                }
            });

            app.get('/hubba/api/me', function (req, res) {
                res.send(200, req.user);
            });


            /**
             * Users API
             **/

            app.get('/hubba/api/users', hubbaUsersController.getAll);
            app.get('/hubba/api/users/:id', hubbaUsersController.get);
            app.post('/hubba/api/users', hubbaUsersController.post);
            app.put('/hubba/api/users/:id', hubbaUsersController.put);
            app.patch('/hubba/api/users/:id', hubbaUsersController.patch);
            app.del('/hubba/api/users/:id', hubbaUsersController.del);


            /**
             * Authenticators API
             **/

            var AuthenticatorList = require('./authenticators/authenticatorList').AuthenticatorList,
                AuthenticatorAPIController = require('./authenticators/authenticatorAPIController').AuthenticatorAPIController,
                PassportRouter = require('./authenticators/passportRouter').PassportRouter,
                authenticators = new AuthenticatorList({ store: hStore.authenticators }),
                authenticatorsController = new AuthenticatorAPIController({ AuthenticatorList: authenticators }),
                passportRouter = new PassportRouter({ passport: appPassport, clientFactory: clientFactory, logger: logger });

            try {
                passportRouter.updateSerializers(serverConfigurationItems.USER_SERIALIZE);
            } catch(e) {
                console.log(e);
            }

            try {
                passportRouter.updateDeserializers(serverConfigurationItems.USER_DESERIALIZE);
            } catch(e) {
                console.log(e);
            }

            serverConfiguration.on('update:USER_SERIALIZE', function(val) {
                passportRouter.updateSerializers(val);
            }).on('update:USER_DESERIALIZE', function(val) {
                passportRouter.updateDeserializers(val);
            });


            authenticators.on('add', function (s) {
                passportRouter.update(s);
            }).on('update', function (s) {
                passportRouter.update(s);
            }).on('remove', function (s) {
                passportRouter.update(s);
            });

            app.all('/api/logout', function (req, res) {
                if (req.method === "POST") {
                    req.logout();
                    res.send(200);
                } else {
                    res.send(404, 'Cannot ' + req.method + ' ' + req.path);
                }
            });

            app.all('/api/login/:strategy', function (req, res, next) {
                try {
                    passportRouter.authenticate(req.params.strategy)(req, res, function (err) {
                        if (err) {
                            next(err);
                            return;
                        }
                        res.send(200, req.user);
                    });
                } catch (e) {
                    e.status = 500;
                    next(e);
                }
            });

            app.get('/hubba/api/authenticators', authenticatorsController.getAll);
            app.get('/hubba/api/authenticators/:id', authenticatorsController.get);
            app.post('/hubba/api/authenticators', authenticatorsController.post);
            app.put('/hubba/api/authenticators/:id', authenticatorsController.put);
            app.patch('/hubba/api/authenticators/:id', authenticatorsController.patch);
            app.del('/hubba/api/authenticators/:id', authenticatorsController.del);
            app.get('/hubba/api/authenticator-strategies', authenticatorsController.getStrategies);


            /**
             * Services API
             **/

            var ServiceList = require('./service/serviceList').ServiceList,
                ServiceAPIController = require('./service/serviceAPIController').ServiceAPIController,
                ServiceRouter = require('./service/serviceRouter').ServiceRouter,
                servicesRouter = new ServiceRouter({server: app, logger: logger, clientFactory: clientFactory}),
                services = new ServiceList({ store: hStore.services }),
                servicesController = new ServiceAPIController({ serviceList: services });


            services.on('add', function (s) {
                servicesRouter.updateRoute(s);
            }).on('update', function (s) {
                servicesRouter.updateRoute(s);
            }).on('remove', function (s) {
                servicesRouter.updateRoute(s);
            });

            app.get('/hubba/api/services', servicesController.getAll);
            app.get('/hubba/api/services/:id', servicesController.get);
            app.post('/hubba/api/services', servicesController.post);
            app.put('/hubba/api/services/:id', servicesController.put);
            app.patch('/hubba/api/services/:id', servicesController.patch);
            app.del('/hubba/api/services/:id', servicesController.del);


            /**
             * Service Types API
             */

            var serviceTypesStaticServer = express.static(appNodeModulesFolder);

            app.get('/hubba/api/service_types', servicesController.getTypes);

            app.get('/hubba/api/service_types/:type/docs*', function (req, res) {

                req.url = req.url.replace('/hubba/api/service_types/' + req.params.type + '/docs', '/hubba-adapter-' + req.params.type + '/hubba_docs');

                serviceTypesStaticServer(req, res, function () {
                    res.send(404, 'Uh Oh, this resource has no documentation. Tsk Tsk..');
                });
            });


            /**
             * Sockets API
             **/

            var SocketList = require('./socket/socketList').SocketList,
                SocketAPIController = require('./socket/socketAPIController').SocketAPIController,
                SocketRouter = require('./socket/socketRouter').SocketRouter,
                socketsRouter = new SocketRouter({server: app, clientFactory: clientFactory, logger: logger}),
                sockets = new SocketList({store: hStore.sockets}),
                socketsController = new SocketAPIController({socketList: sockets});

            sockets.on('add', function (s) {
                socketsRouter.addRoute(s);
            }).on('update', function (s) {
                socketsRouter.updateRoute(s);
            }).on('remove', function (s) {
                socketsRouter.removeRoute(s);
            });

            app.get('/hubba/api/sockets', socketsController.getAll);
            app.get('/hubba/api/sockets/:id', socketsController.get);
            app.post('/hubba/api/sockets', socketsController.post);
            app.put('/hubba/api/sockets/:id', socketsController.put);
            app.patch('/hubba/api/sockets/:id', socketsController.patch);
            app.del('/hubba/api/sockets/:id', socketsController.del);


            /**
             * Files API
             **/

            var FileList = require('./file/fileList').FileList,
                FileAPIController = require('./file/fileAPIController').FileAPIController,
                files = new FileList({store: hStore.files, rootDirectory: appPublicFolder}),
                filesController = new FileAPIController({ fileList: files });

            app.get('/hubba/api/files', filesController.getAll);
            app.get('/hubba/api/files/:id', filesController.get);
            app.post('/hubba/api/files', filesController.post);
            app.put('/hubba/api/files/renameFolder', filesController.renameFolder);
            app.put('/hubba/api/files/removeFolder', filesController.removeFolder);
            app.put('/hubba/api/files/:id', filesController.put);
            app.patch('/hubba/api/files/:id', filesController.patch);
            app.del('/hubba/api/files/:id', filesController.del);


            /**
             * Server Configuration API
             **/

            var ServerConfigurationAPIController = require('./serverConfiguration/serverConfigurationAPIController').ServerConfigurationAPIController,
                serverConfigurationsController = new ServerConfigurationAPIController({ serverConfiguration: serverConfiguration });

            app.get('/hubba/api/server_configurations', serverConfigurationsController.getAll);
            app.get('/hubba/api/server_configurations/:key', serverConfigurationsController.get);
            app.post('/hubba/api/server_configurations', serverConfigurationsController.post);
            app.put('/hubba/api/server_configurations/:key', serverConfigurationsController.put);
            app.patch('/hubba/api/server_configurations/:key', serverConfigurationsController.patch);
            app.del('/hubba/api/server_configurations/:key', serverConfigurationsController.del);


            /**
             *  Logs API
             **/

            app.get('/hubba/api/logs', function (req, res, next) {
                try {
                    logger.snapshot(function (log) {
                        res.json(log);
                    });
                } catch (err) {
                    err.status = 500;
                    next(err);
                }
            });


            /**
             *  Tests API
             **/

            require('./test/testAPIController').registerRoutes({ server: app, store: hStore.tests });

            /**
             * Error handler
             */

            app.use(function serverErrorHandler(err, req, res, next) {
                var e;

                if (err instanceof Error || Object.prototype.toString.call(err) === '[object Error]') {
                    e = {
                        status: err.status || 500,
                        message: err.message,
                        stack: err.stack,
                        error: true
                    };

                    res.send(e.status, e);

                    // better information for the logger
                    e.req = { id: req.id };
                    e.res = { statusCode: err.status || 500 };

                    logger.log(e);
                } else {
                    next();
                }
            });


            /**
             * Static file router
             **/

            var publicStaticServer = express.static(appPublicFolder);
            // TODO: make this configurable (based on regex?)
            //  this is the push-state option
            //  add a redirect to homepage option
            //  add a 404 option
            app.get(/^(?!\/api).*/i, function (req, res, next) {
                publicStaticServer(req, res, function () {
                    req.url = '/';
                    publicStaticServer(req, res, next);
                });
            });


            // Start the app
            app.listen(serverPort);
            console.log("Hubba listening on port: " + serverPort);
            logger.log("Hubba restarted, using port: " + serverPort);
        }); // findAll server configs
    }); // connect to db
}




if (options.argv.help){
    options.showHelp();
} else {
    HubbaApp({
        dir: options.argv.dir
    });
}