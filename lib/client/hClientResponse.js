"use strict";

/*

    INPUT:
        restify res object

    OUTPUT:
        internal response object which overrides res.send to satisfy a promise

 */

var iHeader = function(){return this;},
    iCache = iHeader;

function HClientResponse(resolver){
    return  {
        send: function iSend(code,b,config){

            var body = b || null;

            // copy of Restify code from /lib/response.js
            if (code === undefined) {
                code = 200;
            } else if (code.constructor.name === 'Number') {
                if (body instanceof Error) {
                    body.statusCode = code;
                }
            } else {
                config = body;
                body = code;
                code = 200;
            }

            // resolve promise unless error code >= 400 or data is an Error object, then reject
            if (code >= 400){
                resolver.reject({body:body,code:code,config:config});
            } else {
                resolver.resolve({body:body,code:code,config:config});
            }
        },
        header: iHeader,
        cache: iCache
    };
};

exports.HClientResponse = HClientResponse;