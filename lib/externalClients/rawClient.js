(function() {

    'use strict';

    var ayepromise = {};

    /* Wrap an arbitrary number of functions and allow only one of them to be
     executed and only once */
    var once = function () {
        var wasCalled = false;

        return function wrapper(wrappedFunction) {
            return function () {
                if (wasCalled) {
                    return;
                }
                wasCalled = true;
                wrappedFunction.apply(null, arguments);
            };
        };
    };

    var getThenableIfExists = function (obj) {
        // Make sure we only access the accessor once as required by the spec
        var then = obj && obj.then;

        if (obj !== null &&
            typeof obj === "object" &&
            typeof then === "function") {

            return then.bind(obj);
        }
    };

    var aThenHandler = function (onFulfilled, onRejected) {
        var defer = ayepromise.defer();

        var doHandlerCall = function (func, value) {
            setTimeout(function () {
                var returnValue;
                try {
                    returnValue = func(value);
                } catch (e) {
                    defer.reject(e);
                    return;
                }

                if (returnValue === defer.promise) {
                    defer.reject(new TypeError('Cannot resolve promise with itself'));
                } else {
                    defer.resolve(returnValue);
                }
            }, 1);
        };

        return {
            promise: defer.promise,
            callFulfilled: function (value) {
                if (onFulfilled && onFulfilled.call) {
                    doHandlerCall(onFulfilled, value);
                } else {
                    defer.resolve(value);
                }
            },
            callRejected: function (value) {
                if (onRejected && onRejected.call) {
                    doHandlerCall(onRejected, value);
                } else {
                    defer.reject(value);
                }
            }
        };
    };

    // States
    var PENDING = 0,
        FULFILLED = 1,
        REJECTED = 2;

    ayepromise.defer = function () {
        var state = PENDING,
            outcome,
            thenHandlers = [];

        var doFulfill = function (value) {
            state = FULFILLED;
            outcome = value;

            thenHandlers.forEach(function (then) {
                then.callFulfilled(outcome);
            });
        };

        var doReject = function (error) {
            state = REJECTED;
            outcome = error;

            thenHandlers.forEach(function (then) {
                then.callRejected(outcome);
            });
        };

        var executeThenHandlerDirectlyIfStateNotPendingAnymore = function (then) {
            if (state === FULFILLED) {
                then.callFulfilled(outcome);
            } else if (state === REJECTED) {
                then.callRejected(outcome);
            }
        };

        var registerThenHandler = function (onFulfilled, onRejected) {
            var thenHandler = aThenHandler(onFulfilled, onRejected);

            thenHandlers.push(thenHandler);

            executeThenHandlerDirectlyIfStateNotPendingAnymore(thenHandler);

            return thenHandler.promise;
        };

        var safelyResolveThenable = function (thenable) {
            // Either fulfill, reject or reject with error
            var onceWrapper = once();
            try {
                thenable(
                    onceWrapper(transparentlyResolveThenablesAndFulfill),
                    onceWrapper(doReject)
                );
            } catch (e) {
                onceWrapper(doReject)(e);
            }
        };

        var transparentlyResolveThenablesAndFulfill = function (value) {
            var thenable;

            try {
                thenable = getThenableIfExists(value);
            } catch (e) {
                doReject(e);
                return;
            }

            if (thenable) {
                safelyResolveThenable(thenable);
            } else {
                doFulfill(value);
            }
        };

        var onceWrapper = once(),
            p = {
                resolve: onceWrapper(transparentlyResolveThenablesAndFulfill),
                reject: onceWrapper(doReject),
                promise: {
                    then: function (onSuccess,onFail) {
                        return registerThenHandler(function(obj){
                            onSuccess(obj.body,obj.code);
                        }, function(obj){
                            onFail(obj.body,obj.code);
                        });
                    },
                    success: function (onSuccess) {
                        return registerThenHandler(function(obj){
                            onSuccess(obj.body,obj.code);
                        }, null);
                    },
                    fail: function (onFail) {
                        return registerThenHandler(null, function(obj){
                            onFail(obj.body,obj.code);
                        });
                    },
                    ensure: function (onEnsure) {
                        return registerThenHandler(function(obj){
                            onEnsure(obj.body,obj.code);
                        }, function(obj){
                            onEnsure(obj.body,obj.code);
                        });
                    }
                }
            };

        p.promise.done = p.promise.success;
        p.promise.error = p.promise.catch = p.promise.fail;
        p.promise.finally = p.promise.ensure;

        return p;
    };


    /* Adapted from http://www.quirksmode.org/js/xmlhttp.html */
    function parseBody(req) {
        var header = req.getResponseHeader('Content-Type');
        if (header === "application/json" && req.responseText) {
            try {
                return JSON.parse(req.responseText);
            } catch (ex) {
                console.error("Failed to parse \"" + req.responseText + "\" as JSON", ex);
                return req.responseText;
            }
        } else {
            return req.responseText;
        }

    }

    function sendRequest(url,options, promise) {
        var req = createXMLHTTPObject();
        if (!req) return Error("AJAX is somehow not supported");

        if (options.query) url += '?' + options.query;

        var data = options.data;
        var method = options.method || "GET";
        req.open(method,url,true);
        req.withCredentials = true;
        // req.setRequestHeader('User-Agent','XMLHTTP/1.0');
        if (data)
            req.setRequestHeader('Content-type', options.contentType || 'application/json');
        if (typeof sendRequest.headers === 'object') {
            for (var k in sendRequest.headers) {
                if (sendRequest.headers.hasOwnProperty(k)) {
                    req.setRequestHeader(k, sendRequest.headers[k]);
                }
            }
        }
        req.onreadystatechange = function () {
            if (req.readyState != 4) return;
            if (req.status != 200 && req.status != 204 && req.status != 304) {
                if (typeof options.error === 'function') options.error(parseBody(req),req.status);
                return;
            }
            if (typeof options.success === 'function') options.success(parseBody(req),req.status);
        };
        if (req.readyState == 4) return;
        req.send(data);
    }

    sendRequest.headers = {};

    var XMLHttpFactories = [
        function () {return new XMLHttpRequest()},
        function () {return new ActiveXObject("Msxml2.XMLHTTP")},
        function () {return new ActiveXObject("Msxml3.XMLHTTP")},
        function () {return new ActiveXObject("Microsoft.XMLHTTP")},
        function () {return new XDomainRequest()}
    ];

    function createXMLHTTPObject() {
        var xmlhttp = false;
        for (var i=0;i<XMLHttpFactories.length;i++) {
            try {
                xmlhttp = XMLHttpFactories[i]();
            }
            catch (e) {
                continue;
            }
            break;
        }
        return xmlhttp;
    }


    function ajax(method,url,body,config){
        var c = config || {},
            b = body,
            d = ayepromise.defer();

        c.data = JSON.stringify(b) || "{}";
        c.method = method;
        c.success = function(data,code){
            d.resolve({body:data,code:code});
        }
        c.error = function(err,code){
            d.reject({body:err,code:code});
        }

        sendRequest(url, c);

        return d.promise;
    };

    if (!window.hubba) {
        window.hubba = {
            get: function(url,options){
                return ajax('get',url,undefined,options);
            },
            post: function(url,body,options){
                return ajax('post',url,body,options);
            },
            put: function(url,body,options){
                return ajax('put',url,body,options);
            },
            patch: function(url,body,options){
                return ajax('patch',url,body,options);
            },
            del: function(url,options){
                return ajax('del',url,undefined,options);
            }
        };
    }
})();