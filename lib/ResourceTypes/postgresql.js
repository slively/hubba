"use strict";

var assert = require('assert-plus');

function createPool(resource){
    var self = this;

    // reset waiting queue (new requests will go here until the update is done)
    resource.data.waitingQueue = [];


    // delete the current connection object
    resource.data.pool = undefined;

    // create new connection object
    resource.data.pool = require('pg');
    resource.data.pool.defaults.host = resource.configuration.host;
    resource.data.pool.defaults.port = resource.configuration.port;
    resource.data.pool.defaults.user = resource.configuration.user;
    resource.data.pool.defaults.password = resource.configuration.password;
    resource.data.pool.defaults.database = resource.configuration.database;
    resource.data.pool.defaults.poolSize = resource.configuration.poolSize;
    resource.data.pool.defaults.ssl = resource.configuration.ssl;

    // fire all events in the waiting queue
    resource.data.waitingQueue.forEach(function(obj){
        queryHandler.apply(self,obj.args);
    });

    // resume normal connection handling
    resource.data.connecting = false;
};

function update(resource){

    // new connections will go to the waitingQueue
    resource.data.connecting = true;

    if (resource.data.pool){
        // disconnect all connections
        resource.data.pool.end();
    }

    createPool(resource);
};

/*
 Post body is in this format:
 {
     sql: 'select ....',
     values: [...] (optional)
 }
 */
function queryHandler(resource,req,res){
    assert.string(req.body.sql,'sql');

    resource.data.pool.connect(function(err, client, done) {
        if (err){
            res.send(500,err);
            return;
        }

        client.query(req.body.sql, req.body.values, function(err, rows) {

            // TODO: if a connection error, try again
            // other special error handling
            if (err){
                res.send(400,err);
                return;
            }

            res.send(200,rows);
            done();
        });
    });
};

exports.ResourceType = {
    name: 'postgresql',
    label: 'PostgreSQL Connector',
    configuration: {
        host: { inputType: 'text', placeholder:'The database hostname', value: '', required: true },
        port: { inputType: 'number', placeholder:'The database port', value: 5432, required: true },
        user: { inputType: 'text', placeholder:'The username for authentication.', value: '', required: true },
        password: { inputType: 'password', placeholder:'The password for authentication.', value: '', required: true },
        database: { inputType: 'text', placeholder:'The database to connect to.', value: '', required: true },
        poolSize: { inputType: 'number', placeholder:'Number of unique Client objects to maintain in the pool. If this value is set to 0, pooling will be disabled and pg#connect will always return a new client.', value: 10 },
        ssl: { inputType: 'checkbox', value:false, header: 'Use SSL' }
    },
    POST: function(resource,req,res){
        // if currently connecting, put request in the waitingQueue
        if (resource.data.connecting === true){
            waitingQueue.push({
                args: [resource,req,res]
            });
        } else {
            queryHandler(resource,req,res);
        }
    },
    init: update,
    update: update
};