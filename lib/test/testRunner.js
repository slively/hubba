/**
 *  How it all works together:
 *      A test transaction starts by finding the correct match in the expressjs router
 *      and executing the router function with a test flag on the req object. Each
 *      Mock for the test is used as an override in the hubba client. Effectively
 *      hubba.get('/api/mymockendpont').success or .error are set to a static function
 *      that will return the defined output in the mock. During a test request logging
 *      will be redirected to an in memory array that will be returned to the test runner.
 *
 *  Inputs:
 *      an instantiated express.io server
 *      a test object
 *
 *  call server.handle(req,res,next) with a mock res.send / res.json
 *
 *
 *  Test Errors - these are the possible errors throw on test failure
 *      body failed to match
 *      status code failed to match
 *      headers failed to match
 *      required mock not executed
 */

var assert = require('assert-plus'),
    http = require('http'),
    Test = require('./test').Test,
    _ = require('lodash');

function TestRunner(opts) {
    var o = opts || {};

    assert.func(o.server,'TestRunner server');
    this._server = o.server;
}

TestRunner.prototype.runTest = function runTestDef(test, cb) {
    var self = this,
        mockReq,
        mockRes,
        resBody = '';

    assert.ok(test instanceof Test,'TestRunner - runTest - first parameter must be an instance of Test');
    assert.func(cb,'TestRunner - runTest - second parameter must be a function');

    mockReq = new http.IncomingMessage({ encrypted: true });
    mockReq.url = test.req.path;
    mockReq.method = test.req.method;
    mockReq.headers = test.req.headers;
    mockReq._mocks = test.mocks;
    mockRes = new http.ServerResponse({ method: test.req.method });

    mockRes.write = function(data) {
        resBody += data;
    };
    // TODO: timeouts are good...
    mockRes.end = function(data){
        resBody += (data) ? data : '';
        cb(null,self._processTestResults(mockReq, mockRes, test, resBody));
    };
    this._server.handle(mockReq, mockRes);
};

TestRunner.prototype._processTestResults = function _processTestResultsDef(req, res, test, resBody) {
    var results = {
        passed: true,
        response: {
            statusCode: res.statusCode,
            headers: res._headers,
            body: resBody
        },
        failures: []
    };

    if (test.res.statusCode !== res.statusCode) {
        results.passed = false;
        results.failures.push({
            field: 'statusCode',
            expected: test.res.statusCode,
            actual: res.statusCode
        });
    }

    _.forEach(test.res.headers, function(val, key){
        if (res._headers[key] !== val) {
            results.passed = false;
            results.failures.push({
                field: 'header',
                name: key,
                expected: val,
                actual: res._headers[key]
            });
        }
    });

    if (test.res.body !== resBody) {
        results.passed = false;
        results.failures.push({
            field: 'body',
            expected: test.res.body,
            actual: resBody
        });
    }

    return results;
};

exports.TestRunner = TestRunner;