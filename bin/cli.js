#!/usr/bin/env node
"use strict";

var optimist = require('optimist'),
    options = optimist.usage('Run a Hubba web server.\n Usage: $0').options({
        help : {
            alias : 'h',
            describe : 'Show this help information.'
        }
    }).usage('Usage:\n' +
             'hubba start myproject \t start the server for an existing app \n  ' +
             'hubba stop myproject \t\t stop the server for an existing app \n  ' +
             'hubba restart myproject \t restart the server for an existing app \n  ' +
             'hubba delete myproject \t delete an app and all associated files (cannot be undone). \n  ' +
             'hubba list \t\t list running hubba apps');


function main(argv){

    if (['delete','start','stop','restart'].indexOf(argv._[0]) !== -1 && argv._.length < 2) {
        console.log("\nCommand '" + argv._[0] + "' requires a project name.\n");
        options.showHelp();
        return;
    }

    var prompt = require('prompt'),
        forever = require('forever'),
        fs = require('fs'),
        stopApp = function (cb) {
            var stopError = true,
                done = cb || function(err){
                    if (err) {
                        console.log(argv._[1] + ' is not running, no action taken.');
                    } else {
                        console.log('App ' + argv._[1] + ' stopped successfully.');
                    }
                };

            forever.list(null,function(err,list){
                for ( var i in list ) {
                    if (list[i].pidFile === __dirname+'/pids/'+argv._[1]+'.pid') {
                        forever.stop(i);
                        stopError = null;
                    }
                }
                done(stopError);
            });
        };

    switch(argv._[0]) {


        case 'start':
            try {
                fs.mkdirSync(__dirname+'/pids');
            } catch(e) {}
            try {
                fs.mkdirSync(__dirname+'/logs');
            } catch(e) {}
            try {
                fs.writeFileSync(__dirname+'/logs/'+argv._[1]+'.log','',{flag:'wx'});
            } catch(e) {}
            try {
                fs.writeFileSync(__dirname+'/logs/'+argv._[1]+'.out','',{flag:'wx'});
            } catch(e) {}
            try {
                fs.writeFileSync(__dirname+'/logs/'+argv._[1]+'.err','',{flag:'wx'});
            } catch(e) {}


            if (fs.existsSync(__dirname+'/pids/'+argv._[1]+'.pid')) {
                console.log(argv._[1]+' is already running.');
                return;
            }

            require('openport').find({
                startingPort: 8001,
                endingPort: 8200
            }, function(err, port) {
                if (err) {
                    console.log('error finding open port.');
                    console.log(err);
                    return;
                }

                var p = forever.startDaemon(__dirname+'/../lib/app.js',{
                    max: 1,
                    fork: true,
                    silent: true,
                    pidFile: __dirname+'/pids/'+argv._[1]+'.pid',
                    options: ['-p '+port,'-n '+argv._[1]],
                    logFile: __dirname+'/logs/'+argv._[1]+'.log',
                    outFile: __dirname+'/logs/'+argv._[1]+'.out',
                    errFile: __dirname+'/logs/'+argv._[1]+'.err'
                });
                forever.startServer(p);
                console.log(argv._[1] + ' running on port ' + port);
            });
            break;

        case 'stop':
            stopApp();
            break;

        case 'list':

            forever.list(null,function(err,list){
                if (list && list.length) {
                    for ( var i in list ) {
                        var str = list[i].pidFile.replace(__dirname+'/pids/','').replace('.pid','') + ' running on port ';
                        for ( var j in list[i].options ) {
                            if (list[i].options[j].indexOf('-p ') === 0 ) {
                                str += list[i].options[j].replace('-p ','');
                            }
                        }
                        console.log(str);
                    }
                } else {
                    console.log('No apps running.');
                }
            });
            break;

        case 'stopAll':
            forever.stopAll();
            forever.cleanUp();
            break;

        case 'delete':
            prompt.start();
            prompt.get({
                properties: {
                    confirm: {
                        message: 'This command cannot be undone. Type DELETE to confirm.'
                    }
                }
            }, function(err,result){
                if (result.confirm === 'DELETE') {
                    if (fs.existsSync(__dirname+'/../apps/'+argv._[1])) {

                        stopApp(function(){
                            require('rimraf')(__dirname+'/../apps/'+argv._[1],function(err){
                                if(err){
                                    console.log('Error deleting ' +argv._[1]);
                                    console.log(err.stack);
                                }

                                console.log(argv._[1]+' deleted!');
                            });

                        });

                    } else {
                        console.log(argv._[1]+' not found, no action taken.');
                    }
                }
            });
            break;

        default:
            console.log('\nInvalid command: '+argv._[0]+'\n');
            options.showHelp();
    }
}



if (options.argv.help || options.argv._.length === 0){
    options.showHelp();
} else {
    main(options.argv);
}


