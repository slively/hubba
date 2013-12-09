"use strict";

var assert = require("assert-plus");

Date.prototype.toMySQLDate = function(){
    return this.getYear() + '-' + this.getMonth() + '-' + this.getDay() + ' ' + this.getHours() + ':' + this.getMinutes() + ':' + this.getSeconds();
}

describe('mysql resource', function() {
    var server = require('../../lib/server').startup({
        port: 8081
    });



    var rootId, id, client = require('restify').createJsonClient({
        version: '*',
        url: 'http://127.0.0.1:8081'
    });

    it('GET /hubba/api/resources should get a 200 response', function(done) {
        client.get('/hubba/api/resources', function(err, req, res, data) {
            assert.ifError(err);
            rootId = data.id;
            done();
        });
    });

    it('should get added to the root resource', function(done) {

        client.post('/hubba/api/resources', {
            parentId: rootId,
            name: 'mysql_resource_test',
            type: 'mysql',
            configuration: {
                host: '127.0.0.1',
                port: 3306,
                user: 'root',
                password: 'root',
                database: 'test',
                connectionLimit: 1,
                queueLimit: 100
            }
        }, function(err, req, res, data) {
            assert.ifError(err);
            id = data.id;
            assert.equal('127.0.0.1',data.configuration.host);
            assert.equal(3306,data.configuration.port);
            assert.equal('root',data.configuration.user);
            assert.equal('test',data.configuration.database);
            assert.equal(1,data.configuration.connectionLimit);
            assert.equal(100,data.configuration.queueLimit);
            done();
        });

    });

    it('should successfully delete all rows from the people table.', function(done) {

        client.post('/api/mysql_resource_test', {
            sql: 'DELETE FROM test.people;'
        }, function(err, req, res, data) {
            assert.ifError(err);
            done();
        });

    });

    it('should successfully insert a row into the people table.', function(done) {
        var now = new Date();

        client.post('/api/mysql_resource_test', {
            sql: 'INSERT INTO test.people SET ?',
            values: {name:'test, test', create_dt_tm:now.toMySQLDate()}
        }, function(err, req, res, data) {
            assert.ifError(err);
            done();
        });

    });

    it('should successfully select all rows from the people table.', function(done) {

        client.post('/api/mysql_resource_test', {
            sql: 'SELECT * FROM test.people;'
        }, function(err, req, res, data) {
            assert.ifError(err);
            assert.equal(data[0].name,'test, test');
            done();
        });

    });

    it('should successfully delete all rows from the people table.', function(done) {

        client.post('/api/mysql_resource_test', {
            sql: 'DELETE FROM test.people;'
        }, function(err, req, res, data) {
            assert.ifError(err);
            done();
        });

    });


    it('DELETE /hubba/api/resources should delete "mysql_resource_test" return a 200 response.', function(done) {
        client.del('/hubba/api/resources/'+id, function(err, req, res, data) {
            assert.ifError(err);
            done();
        });
    });

});