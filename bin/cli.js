#!/usr/bin/env node
"use strict";

var optimist = require('optimist'),
    options = optimist.usage('Run a Hubba web server.\n Usage: $0').options({
        help : {
            alias : 'h',
            describe : 'Show this help information.'
        }
    }).usage('Usage:\n  ' +
            'hubba create \t\t\t\t create a new app in the current directory \n  ' +
            'hubba start \t\t\t\t start the server for app in current directory \n  ' +
            'hubba start --path /path/to/app \t start the server for app in specified directory \n  ' +
            'hubba stop myapp \t\t\t stop the server for app by name \n  ' +
            'hubba restart myapp \t\t\t restart the server for app by name \n  ' +
            'hubba delete myapp \t\t\t remove myapp from server list \n  ' +
            'hubba list \t\t\t\t list running hubba apps \n' +
            'See: https://github.com/unitech/pm2 for more details');

function main(argv){

    // these arguments are custom and require an app name
    if (['create'].indexOf(argv._[0]) !== -1 && argv._.length < 2) {
        console.log("\nCommand '" + argv._[0] + "' requires an app name.\n");
        options.showHelp();
        return;
    }

    var prompt = require('prompt'),
        fs = require('fs'),
        exec = require('child_process').exec,
        child,
        pm2 = __dirname+'/../node_modules/pm2/bin/pm2',
        op = require('openport');

    switch(argv._[0]) {

        case 'create':
            var appPath = process.cwd()+'/'+argv._[1],
                hubbaLogsPath = appPath+'/hubba';

            fs.mkdirSync(appPath);
            fs.mkdirSync(hubbaLogsPath);

            fs.writeFileSync(appPath+'/package.json',JSON.stringify({
                "name"       : argv._[1],
                "dependencies": {
                    "hubba-adapter-controller": "*"
                },
                "engines": {
                    "node": "0.10.x"
                }
            }));

            process.chdir(appPath);
            child = exec('npm install', function (error, stdout, stderr) {
                if (error) {
                    console.log(stderr);
                    return;
                }
                console.log('App ' + argv._[1] + ' create successfully.');
            });
            break;

        case 'start':

            // find an open port from 8001 - 9000
            op.find({
                startingPort: 8001,
                endingPort: 9000
            },
                function(err, port) {
                    if(err) { console.log(err); return; }

                    var folders = process.cwd().split('/'),
                        appName = folders[folders.length - 1],
                        localHubbaPath =  process.cwd() + '/hubba/',
                        cmd = pm2 + ' start -x -f ' +
                            __dirname + '/../lib/app.js -o ' +
                            localHubbaPath + 'out.log -e ' +
                            localHubbaPath + 'err.log -p ' +
                            localHubbaPath + 'hubba.pid -n ' +
                            appName  + ' -- --dir ' + process.cwd()
                            + ' --port ' + port;

                    child = exec(cmd, function (err, stdout, stderr) {
                        if (err) {
                            console.log(stderr);
                        } else {
                            console.log(stdout);
                            console.log('App started on port',port);
                        }
                    });
                }
            );
            break;

        // in case we want to limit pm2 access, otherwise should just use default
        case 'restart':
        case 'stop':
        case 'list':
        case 'logs':
        case 'describe':
        case 'ping':
        case 'delete':
        case 'jlist':
        case 'prettylist':
            var cmd = pm2 + ' ' + argv._.join(' ');
            child = exec(cmd, function (error, stdout, stderr) {
                console.log(stdout);
                console.log(stderr);
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