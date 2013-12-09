"use strict";

var assert = require("assert-plus");

describe('postgresql resource', function() {
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
            name: 'postgresql_resource_test',
            type: 'postgresql',
            configuration: {
                host: '127.0.0.1',
                port: 5432,
                user: 'root',
                password: 'root',
                database: 'postgres',
                poolSize: 1
            }
        }, function(err, req, res, data) {
            assert.ifError(err);
            id = data.id;
            assert.equal('127.0.0.1',data.configuration.host);
            assert.equal(5432,data.configuration.port);
            assert.equal('root',data.configuration.user);
            assert.equal('postgres',data.configuration.database);
            assert.equal(1,data.configuration.poolSize);
            done();
        });

    });

    it('should successfully delete all rows from the people table.', function(done) {

        client.post('/api/postgresql_resource_test', {
            sql: 'DELETE FROM people;'
        }, function(err, req, res, data) {
            assert.ifError(err);
            done();
        });

    });

    it('should successfully insert a row into the people table.', function(done) {
        var now = new Date();

        client.post('/api/postgresql_resource_test', {
            sql: 'INSERT INTO people (name,create_dt_tm) values ($1,$2);',
            values: ['test, test', now.toISOString()]
        }, function(err, req, res, data) {
            assert.ifError(err);
            done();
        });

    });

    it('should successfully select all rows from the people table.', function(done) {

        client.post('/api/postgresql_resource_test', {
            sql: 'SELECT * FROM people;'
        }, function(err, req, res, data) {
            assert.ifError(err);
            assert.equal(data.rows[0].name,'test, test');
            done();
        });

    });

    it('should successfully delete all rows from the people table.', function(done) {

        client.post('/api/postgresql_resource_test', {
            sql: 'DELETE FROM people;'
        }, function(err, req, res, data) {
            assert.ifError(err);
            console.log(data);
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