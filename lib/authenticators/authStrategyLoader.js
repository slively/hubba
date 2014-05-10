var assert = require('assert-plus'),
    fs = require('fs'),
    util = require('util'),
    rAuthenticatorFactory = require('./authenticatorFactory').AuthenticatorFactory;

/*
    The AuthStrategyLoader is responsible for reading in hubba-auth-strategy-* folders
    and turning their contents into authStrategyFactories.
 */
exports.AuthStrategyLoader = {
    loadFactoriesSync: function loadFactoriesSyncDef(opts,mocks) {
        var o = opts || {},
            mocks = mocks || {},
            factories = {},
            AuthenticatorFactory = mocks.AuthenticatorFactory || rAuthenticatorFactory,
            path = o.path || __dirname+'/../../node_modules';

        assert.ok(fs.existsSync(path),'AuthStrategyLoader path is not valid: '+path);

        try {
            fs.readdirSync(path).forEach(function(folder) {
                if (fs.lstatSync(path+'/'+folder).isDirectory()) {
                    var adapterName,
                        strategy;

                    if (folder.substring(0,20) === 'hubba-auth-strategy-') {
                        adapterName = folder.substring(20,folder.length);
                        console.log('Found Hubba auth strategy:',adapterName);

                        try {
                            assert.equal(undefined,factories[adapterName],'Auth Strategy ' + adapterName + ' already exists. Auth Strategy names must be unique.');
                            strategy = require(path+'/'+folder+'/index.js').Strategy;
                            strategy.name = adapterName;
                            factories[strategy.name] = new AuthenticatorFactory(strategy);
                        } catch (e) {
                            console.warn('Auth Strategy file ' + path+'/'+folder+'/index.js' + ' produced an error when importing: ');
                            console.warn(e.stack);
                        }
                    }
                }
            });
        } catch (e) {
            console.log('Error reading hubba auth strategy directories from path:',path);
            console.log('The following error was thrown:', e.stack);
        }

        return factories;
    }
};