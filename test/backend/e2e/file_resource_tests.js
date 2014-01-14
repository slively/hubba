"use strict";

var assert = require("assert-plus"),
    fs = require('fs'),
    request = require('request'),
    path = require('path');

describe('File Resource', function() {

    var rootId,
        id,
        client = require('restify').createJsonClient({
            version: '*',
            url: 'http://127.0.0.1:8081'
        });

    it('GET /hubba/api/resources should get a 200 response', function(done) {
        client.get('/hubba/api/resources/root', function(err, req, res, data) {
            assert.ifError(err);
            rootId = data.id;
            done();
        });
    });

    it('should get added to the root resource', function(done) {

        client.post('/hubba/api/resources', {
            parentId: rootId,
            name: 'file_resource_test',
            type: 'file',
            configuration: {
                path: __dirname + '/files'
            }
        }, function(err, req, res, data) {
            assert.ifError(err);
            id = data.id;
            assert.equal(__dirname + '/files',data.configuration.path);
            done();
        });

    });

    it('should successfully upload the test file.', function(done) {
        request.post('http://127.0.0.1:8081/api/file_resource_test',function(err,res,body){
            assert.ifError(err);
            assert.equal(200,res.statusCode,body);
            assert.equal('"/api/file_resource_test/test1.png"',body);
            fs.exists(__dirname+'/files/test1' +
                '.png',function(exists){
                assert.ok(exists);
                done();
            });
        }).form().append('file', fs.createReadStream(path.join(__dirname, 'test1.png')));
    });

    it('should successfully get the test file.', function(done) {
        request('http://127.0.0.1:8081/api/file_resource_test/test1.png',function(err,res,body){
            assert.ifError(err);
            assert.equal(200,res.statusCode,body);
            done();
        });
    });

    it('should successfully update the test file name.', function(done) {
        request.put('http://127.0.0.1:8081/api/file_resource_test/test1.png',function(err,res,body){
            assert.ifError(err);
            assert.equal(200,res.statusCode,body);
            assert.equal('"/api/file_resource_test/test_renamed.png"',body);
            fs.exists(__dirname+'/files/test_renamed.png',function(exists){
                assert.ok(exists);
                done();
            });
        }).form({name:'test_renamed.png'});
    });

    it('should successfully get the renamed test file.', function(done) {
        request('http://127.0.0.1:8081/api/file_resource_test/test_renamed.png',function(err,res,body){
            assert.ifError(err);
            assert.equal(200,res.statusCode,body);
            done();
        });
    });

    it('should successfully delete the renamed test file.', function(done) {
        request.del('http://127.0.0.1:8081/api/file_resource_test/test_renamed.png',function(err,res,body){
            assert.ifError(err);
            assert.equal(200,res.statusCode);

            fs.exists(__dirname+'/files/test_renamed.png',function(exists){
                assert.equal(false,
                    exists);
                done();
            });
        });
    });


    it('should unsuccessfully get the renamed test file.', function(done) {
        request('http://127.0.0.1:8081/api/file_resource_test/test_renamed.png',function(err,res,body){
            assert.ifError(err);
            assert.equal(404,res.statusCode,body);
            done();
        });
    });

    // upload 2 files
    // get the 2 files
    // delete the 2 files
    // fail at getting the 2 files

    it('DELETE /hubba/api/resources should delete "file_resource_test" return a 200 response.', function(done) {
        client.del('/hubba/api/resources/'+id, function(err, req, res, data) {
            assert.ifError(err);
            done();
        });
    });

});