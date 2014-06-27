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
    Test = require('./test').Test;

function TestRunner(opts) {
    var o = opts || {};

    assert.func(o.server,'TestRunner server');
    this._server = o.server;
}

TestRunner.prototype.runTest = function runTestDef(test, cb) {
    var self = this,
        mockReq,
        mockRes;

    assert.ok(test instanceof Test,'TestRunner - runTest - first parameter must be an instance of Test');
    assert.func(cb,'TestRunner - runTest - second parameter must be a function');

    mockReq = new http.IncomingMessage(test.req);
    mockRes = new http.ServerResponse({ method: test.req.method });

    this._server.handle(mockReq, mockRes, function(err) {
        if (err) {
            cb(err);
        } else {
            cb(null,self._processTestResults(mockReq, mockRes, test));
        }
    });
};

TestRunner.prototype._processTestResults = function _processTestResultsDef(req, res, test) {
    return {
        req: req,
        res: res,
        test: test
    };
};

exports.TestRunner = TestRunner;