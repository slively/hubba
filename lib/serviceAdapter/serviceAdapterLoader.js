var assert = require('assert-plus'),
    fs = require('fs'),
    util = require('util'),
    rServiceAdapterFactory = require('./serviceAdapterFactory').ServiceAdapterFactory;

/*
    Takes a path as input and returns a hash of all ServiceAdapterFactories created
    from the .js configuration files.
 */
function ServiceAdapterLoader(opts,mocks){
    var opts = opts || {},
        mocks = mocks || {},
        self = this,
        types = {},
        ServiceAdapterFactory = mocks.ServiceAdapterFactory || rServiceAdapterFactory,
        path = opts.path || __dirname+'/../../node_modules';

    assert.ok(fs.existsSync(path),'ServiceAdapterLoader path is not valid: '+path);

    try {
        fs.readdirSync(path).forEach(function(folder) {
            if (fs.lstatSync(path+'/'+folder).isDirectory()) {
                var adapterName,
                    rtf;

                if (folder.substring(0,14) === 'hubba-adapter-') {
                    adapterName = folder.substring(14,folder.length);
                    console.log('Found Hubba adapter:',adapterName);

                    try {
                        assert.equal(undefined,types[adapterName],'Service adapter ' + adapterName + ' already exists. Service adapter names must be unique.');
                        rtf = new ServiceAdapterFactory({ name:adapterName, path:path+'/'+folder+'/index.js' });
                        types[rtf.name] = rtf;
                    } catch (e) {
                        console.warn('Service adapter file ' + path+'/'+folder+'/index.js' + ' produced an error when importing: ');
                        console.warn(e.stack);
                    }
                }
            }
        });
    } catch (e) {
        console.log('Error reading service adapters directories from path:',path);
        console.log('The following error was thrown:', e.stack);
    }

    return types;
};

exports.ServiceAdapterLoader = ServiceAdapterLoader;