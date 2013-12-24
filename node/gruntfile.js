module.exports = function(grunt) {

    // Project configuration.
    grunt.initConfig({
        cafemocha: {
            'backend-unit' : {
                src : 'test/backend/unit/*.js'
            },
            'backend-rest-api' : {
                src : 'test/backend/rest-api/*.js'
            }
        },
        karma : {
            'backend-e2e' : {
                configFile : 'test/karma/backend.e2e.js'
            },
            'frontend-unit' : {
                configFile : 'test/karma/frontend.unit.js'
            },
            'frontend-integration' : {
                configFile : 'test/karma/frontend.integration.js'
            },
            'frontend-e2e' : {
                configFile : 'test/karma/frontend.e2e.js'
            }
        }
    });

    // server object
    var server;

    // Load plugins
    grunt.loadNpmTasks('grunt-cafe-mocha');
    grunt.loadNpmTasks('grunt-karma');

    // Create tasks

    grunt.registerTask('start-server', 'Start the Hubba server.', function(){
        server = require(__dirname+'/lib/server').createServer({
            port: 8080
        });
    });

    grunt.registerTask('stop-server', function(done){
        server.shutdown();
        done();
    });

    grunt.registerTask('test', [
        'start-server',
        'cafemocha:backend-unit',
        'cafemocha:backend-rest-api',
        'karma:backend-e2e',
        'karma:frontend-unit',
        'karma:frontend-integration',
        'karma:frontend-e2e',
        'stop-server'
    ]);
};