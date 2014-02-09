"use strict";
var assert = require("assert-plus"),
    fs = require('fs');

function getFilePath(resource,req){
    var reqResources = req.url.replace(/\?.*$/,'').split('/'), reqSubResources, i = 0;

    while(reqResources[i] != resource.name && i < reqResources.length){
        i++;
    }

    reqSubResources = reqResources.slice(i+1);

    if (reqSubResources.length !== 1){
        throw 'Invalid url must follow pattern: /api/my_file_resource/:filename'
    }

    return resource.configuration.path + '/' + reqSubResources[0];
};

function getFile(resource,req,res){
    fs.createReadStream(getFilePath(resource,req)).on('error',function(err){
        res.send(404,'File not found.');
    }).pipe(res);
};

function updateFile(resource,req,res){
    assert.string(req.body.name);
    fs.rename(getFilePath(resource,req), resource.configuration.path + '/' + req.body.name, function (err) {
        if (err) throw err;
        res.send(200,resource.path.replace('*','') + '/' + req.body.name);
    });
};

function uploadFile(resource,req,res){

    var k = Object.keys(req.files),
        cnt = k.length;

    k.forEach(function(f){

        var reader = fs.createReadStream(req.files[f].path);

        reader.on('end', function() {
            fs.unlink(req.files[f].path);
            cnt--;
            if (cnt === 0){
                res.send(200,resource.path.replace('*','') + '/' + req.files[f].name);
            }
        });

        reader.on('error',function(err){
            res.send(500,err);
        });

        reader.pipe(fs.createWriteStream(resource.configuration.path + '/' + req.files[f].name));
    });
};

function deleteFile(resource,req,res){
    fs.unlink(getFilePath(resource,req),function(err){
        if(err) throw err;
        res.send(200,'File deleted successfully.');
    });
};

exports.ResourceType = {
    name: 'file',
    label: 'File',
    configuration: {
        path: { inputType: 'text', placeholder:'The file path.', value: '', required: true }
    },
    wildcardRoute: true,
    GET: getFile,
    PUT: updateFile,
    PATCH: updateFile,
    POST: uploadFile,
    DELETE: deleteFile
};