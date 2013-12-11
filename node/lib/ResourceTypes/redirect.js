"use strict";

function redirect(resource,req,res){
    res.header('Location',resource.ResourceType.configuration.url.value);
    res.send(301);
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