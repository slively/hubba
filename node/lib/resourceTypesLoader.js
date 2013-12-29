var assert = require('assert-plus'),
    fs = require('fs'),
    util = require('util'),
    rResourceTypeFactory = require('./resourceTypeFactory').ResourceTypeFactory;

/*
    Takes a path as input and returns a hash of all ResourceTypeFactories created
    from the .js configuration files.
 */
function ResourceTypesLoader(opts,mocks){
    var opts = opts || {},
        mocks = mocks || {},
        self = this,
        types = {},
        ResourceTypeFactory = mocks.ResourceTypeFactory || rResourceTypeFactory,
        path = opts.path || __dirname+'/ResourceTypes';

    assert.ok(fs.existsSync(path),'ResourceTypesLoader path is not valid: '+path);

    fs.readdirSync(path).forEach(function(file) {
        var rtf;

        try {
            rtf = new ResourceTypeFactory({path:path+'/'+file});
            assert.equal(undefined,types[rtf.name],'ResourceType ' + rtf.name + ' already exists. ResourceType names must be unique.');
            types[rtf.name] = rtf
        } catch (e){
            console.warn('ResourceType File ' + file + ' produced an error when importing: ');
            console.warn(e);
        }
    });

    return types;
};

exports.ResourceTypesLoader = ResourceTypesLoader;