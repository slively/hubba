/**
 * Test - res is validated at the end of the test run
 *      name - the test name
 *      description - longer description of the test
 *      req method - get,post,put,patch,delete,emit,broadcast, ...
 *      req path - '/api/...' or 'socketmethod'
 *      req body - json object / string / number / ...
 *      req headers - json object of headers
 *      res body - json object / string / number / ....
 *      res status code - valid status code
 *      res headers - json object of headers
 *      mocks - array of Mocks
 *
 *
 *  Mock - req is used for matching
 *      req method - same as test
 *      req path - same as test
 *      req body - same as test
 *      req headers - same as test
 *      res body - same as Test
 *      res headers - same as test
 *      res status code - same as test
 *      required - test will fail if this mock is not executed (default: on)
 *
 */

var assert = require('assert-plus'),
    _ = require('lodash');

function Test(opts) {
    var o = opts || {},
        self = this;

    assert.string(o.name,'name');
    assert.optionalString(o.description,'description');

    this.id = o.id;
    this.name = o.name;
    this.description = o.description;
    this.req = new TestReq(o.req);
    this.res = new TestRes(o.res);
    this.mocks = [];
    _.each(o.mocks, function(mockOpts){
        self.mocks.push(new Mock(mockOpts));
    });
}

function Mock(opts) {
    var o = opts || {};

    this.req = new TestReq(o.req);
    this.res = new TestRes(o.res);
    this.required = o.required !== false;
}

function TestReq(opts) {
    var o = opts || {};

    assert.string(o.method,'req method');
    assert.string(o.path,'req path');
    assert.optionalObject(o.headers,'req headers');

    this.method = o.method;
    this.path = o.path;
    this.headers = o.headers || {'content-type':'application/json'};
    this.body = o.body;
}

function TestRes(opts) {
    var o = opts || {};

    assert.number(o.statusCode,'res statusCode');
    assert.optionalObject(o.headers,'res headers');

    this.statusCode = o.statusCode;
    this.headers = o.headers;
    this.body = o.body;
}

exports.Test = Test;
