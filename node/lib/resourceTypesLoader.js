/*
    maintains list of all possible resource types
    reads in possible resource types from configuration location
    exposes JSON representation
    exposes hash of all resource types for instantiation

    PUBLIC:
        constructor options
            configurationLocation (absolute file path, default: __dirname+'/ResourceTypes')

        toJson()

        // modifying these is bad
        types (hash)
        configurationLocation (string)
 */
var assert = require('assert-plus'),
    fs = require('fs'),
    util = require('util'),
    ResourceTypeFactory = require('./resourceTypeFactory').ResourceTypeFactory;


function ResourceTypesLoader(opts,mocks){
    var opts = opts || {},
        mocks = mocks || {},
        self = this,
        types = {},
        ResourceTypeFactory = mocks.ResourceTypeFactory || ResourceTypeFactory,
        path = opts.path || __dirname+'/ResourceTypes';

    assert.ok(fs.existsSync(path),'ResourceTypesLoader path is not valid: '+path);

    fs.readdirSync(path).forEach(function(file) {
        var rtf;

        try {
            rtf = new ResourceTypeFactory({path:file});
        } catch (e){
            console.warn('ResourceType File ' + file + ' produced an error when importing: ');
            console.warn(e);
        }

        assert.equal(undefined,types[rtf.name],'ResourceType ' + rtf.name + ' already exists. ResourceType names must be unique.');
        types[rtf.name] = rtf
    });

    return types;
}

exports.ResourceTypesLoader = ResourceTypesLoader;