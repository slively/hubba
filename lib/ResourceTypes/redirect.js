"use strict";

function redirect(resource,req,res){
    res.header('Location',resource.configuration.url);
    res.send(301,{url:resource.configuration.url});
};

exports.ResourceType = {
    name: 'redirect',
    label: 'Redirect',
    configuration: {
        url: { inputType: 'text', placeholder:'The redirect url.', value: '', required: true }
    },
    GET: redirect,
    POST: redirect,
    PUT: redirect,
    PATCH: redirect,
    DELETE: redirect
};