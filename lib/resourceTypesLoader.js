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

    try {
        fs.readdirSync(path).forEach(function(folder) {
            if (fs.lstatSync(path+'/'+folder).isDirectory()) {
                try {
                    fs. readdirSync(path+'/'+folder).forEach(function(file){
                        var rtf;
                        if (file === 'index.js') {
                            try {
                                rtf = new ResourceTypeFactory({name:folder,path:path+'/'+folder+'/'+file});
                                assert.equal(undefined,types[rtf.name],'ResourceType ' + rtf.name + ' already exists. ResourceType names must be unique.');
                                types[rtf.name] = rtf
                            } catch (e){
                                console.warn('ResourceType File ' + file + ' produced an error when importing: ');
                                console.warn(e);
                            }
                        }
                    });
                } catch (e) {
                    console.log('Error reading resource type directory from path:',path);
                    console.log('The following error was thrown:',e);
                }
            } else {
                console.log(folder + ' is not a folder and should be removed from the ResourceTypes directory.');
            }
        });
    } catch (e) {
        console.log('Error reading resource types directories from path:',path);
        console.log('The following error was thrown:',e);
    }

    return types;
};

exports.ResourceTypesLoader = ResourceTypesLoader;