"use strict";

module.exports = function(grunt) {

    // Project configuration.
    grunt.initConfig({
        cafemocha: {
            'backend-unit' : {
                src : 'test/backend/unit/*.js'
            },
            'backend-integration' : {
                src : 'test/backend/integration/*.js'
            },
            'backend-e2e' : {
                src : ['test/backend/e2e/*.js']
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
        },
        shell: {
            'kill-test-servers': {
                command: "kill $( ps aux | grep '[s]erver.js' | awk '{print $2}')",
                options: {
                    failOnError: false
                }
            },
            'test-server': {
                command: 'node ./lib/server.js --store "memory"',
                options: {
                    async: true,
                    failOnError: true
                }
            }
        }
    });

    // server object
    var server;

    // Load plugins
    grunt.loadNpmTasks('grunt-cafe-mocha');
    grunt.loadNpmTasks('grunt-karma');
    grunt.loadNpmTasks('grunt-shell-spawn');

    // Create tasks
    grunt.registerTask('test-backend-unit', [
        'cafemocha:backend-unit'
    ]);

    grunt.registerTask('test-backend-integration', [
        'cafemocha:backend-integration'
    ]);

    grunt.registerTask('test-backend-e2e', [
        'shell:kill-test-servers',
        'shell:test-server',
        'cafemocha:backend-e2e',
        //'karma:backend-e2e',
        'shell:test-server:kill'
    ]);

    grunt.registerTask('test-frontend-unit', [
        'karma:frontend-unit'
    ]);

    grunt.registerTask('test-frontend-integration', [
        'karma:frontend-integration'
    ]);

    grunt.registerTask('test-frontend-e2e', [
        'shell:test-server',
        'karma:frontend-e2e',
        'shell:test-server:kill'
    ]);

    grunt.registerTask('test-backend', [
        'test-backend-unit',
        'test-backend-integration',
        'test-backend-e2e'
    ]);

    grunt.registerTask('test-frontend', [
        'test:frontend-unit',
        'test:frontend-integration',
        'test:frontend-e2e'
    ]);

    grunt.registerTask('test-all', [
        'shell:test-server',
        'test-backend',
        'test-frontend',
        'shell:test-server:kill'
    ]);

};