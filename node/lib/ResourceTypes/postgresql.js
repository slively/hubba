"use strict";

var assert = require('assert-plus');

function createPool(resource){
    var self = this;

    // reset waiting queue (new requests will go here until the update is done)
    resource.ResourceType.waitingQueue = [];


    // delete the current connection object
    resource.ResourceType.pool = undefined;

    // create new connection object
    resource.ResourceType.pool = require('pg');
    resource.ResourceType.pool.defaults.host = resource.ResourceType.configuration.host.value;
    resource.ResourceType.pool.defaults.port = resource.ResourceType.configuration.port.value;
    resource.ResourceType.pool.defaults.user = resource.ResourceType.configuration.user.value;
    resource.ResourceType.pool.defaults.password = resource.ResourceType.configuration.password.value;
    resource.ResourceType.pool.defaults.database = resource.ResourceType.configuration.database.value;
    resource.ResourceType.pool.defaults.poolSize = resource.ResourceType.configuration.poolSize.value;
    resource.ResourceType.pool.defaults.ssl = resource.ResourceType.configuration.ssl.value;

    // fire all events in the waiting queue
    resource.ResourceType.waitingQueue.forEach(function(obj){
        queryHandler.apply(self,obj.args);
    });

    // resume normal connection handling
    resource.ResourceType.connecting = false;
};

function update(resource){

    // new connections will go to the waitingQueue
    resource.ResourceType.connecting = true;

    if (resource.ResourceType.pool){
        // disconnect all connections
        resource.ResourceType.pool.end();
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

    resource.ResourceType.pool.connect(function(err, client, done) {
        if (err){
            throw err;
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
        if (this.ResourceType.connecting === true){
            waitingQueue.push({
                args: [resource,req,res]
            });
        } else {
            queryHandler(resource,req,res);
        }
    },
    RESOURCE_CREATE: update,
    RESOURCE_UPDATE: update
};