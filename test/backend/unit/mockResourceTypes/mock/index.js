"use strict";

exports.ResourceType = {
    name: 'mock',
    label: 'Mock',
    configuration: {
        defaultText: { inputType: 'text', value: '' },
        optionsText: { inputType: 'text', placeholder:'placeholder', value: 'default', required: true },

        defaultSelectMultiple: { inputType: 'select', value: [''], multiple: true, options:[''] },
        optionsSelectMultiple: { inputType: 'select', value: [1,2], multiple: true, options: [1,2], placeholder:'placeholder', required: true },

        defaultSelect: { inputType: 'select', value: '', options:[''] },
        optionsSelect: { inputType: 'select', placeholder:'placeholder', value: 'a', options: ['a','b'], required: true },

        defaultRadio: { inputType: 'radio', value: '', options:[''] },
        optionsRadio: { inputType: 'radio', header:'header', value: 'a', options:['a','b'], required: true },

        defaultCheckbox: { inputType: 'checkbox', value: false },
        optionsCheckbox: { inputType: 'checkbox', header:'header', value: true },

        password: { inputType: 'password', value: 'password' }
    },
    init: function(){
        var init = true;
    },
    validate: function(){
        var validate = true;
    },
    update: function(){
        var update = true;
    },
    destroy: function(){
        var destroy = true;
    },
    GET: function(resource,req,res){
        res.send('Woo!');
    },
    POST: function(resource,req,res){
        res.send('Woo!');
    },
    PUT: function(resource,req,res){
        res.send('Woo!');
    },
    PATCH: function(resource,req,res){
        res.send('Woo!');
    },
    DELETE: function(resource,req,res){
        res.send('Woo!');
    },
};