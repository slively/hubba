"use strict";

var mysql = require('mysql'),
    assert = require('assert-plus');

function createPool(resource){
    var self = this;

    // reset waiting queue (new requests will go here until the update is done)
    resource.ResourceType.waitingQueue = [];


    // delete the current connection object
    resource.ResourceType.pool = undefined;

    // create new connection object
    resource.ResourceType.pool = mysql.createPool({
        host     : resource.ResourceType.configuration.host.value,
        user     : resource.ResourceType.configuration.user.value,
        password : resource.ResourceType.configuration.password.value,
        database : resource.ResourceType.configuration.database.value,
        localAddress : resource.ResourceType.configuration.localAddress.value,
        socketPath : resource.ResourceType.configuration.socketPath.value,
        connectionLimit : resource.ResourceType.configuration.connectionLimit.value,
        queueLimit : resource.ResourceType.configuration.queueLimit.value,
        supportBigNumbers : true,
        bigNumberStrings : true
    });

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
        // disconnect all connections and wait for them to end
        resource.ResourceType.pool.end(function(){
            createPool(resource);
        });
    } else {
        // server start
        createPool(resource);
    };
};

/*
    Post body is in this format:
    {
        sql: 'select ....',
        values: [...], (optional)
        nestTables: '...' (optional)
    }
 */
function queryHandler(resource,req,res){
    assert.string(req.body.sql,'sql');

    var q = {
            sql: req.body.sql,
            nestTables: req.body.nestTables
        },
        v = req.body.values || [];

    resource.ResourceType.pool.getConnection(function(err, connection) {
        if (err){
            throw err;
        }

        connection.query(q, v, function(err, rows) {

            // TODO: if a connection error, try again
            // other special error handling
            if (err){
                res.send(400,err);
                return;
//                throw err;
            }

            res.send(200,rows);
        });

        connection.release();
    });
};

exports.ResourceType = {
	name: 'mysql',
	label: 'MySQL Connector',
	configuration: {
        host: { inputType: 'text', placeholder:'The database hostname', value: '', required: true },
        port: { inputType: 'number', placeholder:'The database port', value: 3306, required: true },
		user: { inputType: 'text', placeholder:'The username for authentication.', value: '', required: true },
		password: { inputType: 'password', placeholder:'The password for authentication.', value: '', required: true },
        database: { inputType: 'text', placeholder:'The database to connect to.', value: '', required: true },
        localAddress: { inputType: 'text', placeholder:'The source IP address to use for TCP connection.', value: '' },
        socketPath: { inputType: 'text', placeholder:'The path to a unix domain socket to connect to. When used host and port are ignored.', value: '' },
        connectionLimit: { inputType: 'number', placeholder:'The maximum number of connections to create at once. (Default: 10)', value: 10 },
        queueLimit: { inputType: 'number', placeholder:'The maximum number of connection requests the pool will queue before returning an error from getConnection. If set to 0, there is no limit to the number of queued connection requests. (Default: 0)', value: 0 }
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