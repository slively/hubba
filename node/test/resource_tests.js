var assert = require("assert");
var root = require('../lib/resource').generateResources();
var resourceTypes = require('../lib/resource_type').getResourceTypes();

describe('Resource tests', function() {
/*

	describe('add resource without a type', function() {
    	it('root resource should note have a child resource named \'notype\'', function(done) {
	        
			try {
				root.addChild('notype');
			} catch (e){
				
			}
			
			assert('undefined',typeof root.children.type,'Child should not have child named \'test\'.');
			done();
		});
	});

	describe('add child resource of type rest to root', function() {
		it('root resource should have a child rest resource named \'rest_res\'', function(done) {
	        
			root.addChild('rest_res',{
				type:'rest'
			});
			assert('rest',root.children.rest_res.type,'Child should have type \'rest\', instead is ' +root.children.rest_res.type);
			done();
		});
    });

	describe('add child resource to a non-area resource', function() {
        it('rest resource should not have a child rest resource named \'bad_rest\'', function(done) {
	        
			try {
				root.children.rest_res.addChild('bad_rest',{
					type:'rest'
				});
			} catch (e){
				
			}
			
			assert('undefined',typeof root.children.rest_res.children.bad_rest,'Child should not have child named \'bad_rest\'.');
			done();
		});
    });

	describe('remove child resource of type rest from root successfully', function() {
        it('root resource should not have a child rest resource named \'rest_res\'', function(done) {
	        
			root.removeChild('rest_res');
			assert('undefined',typeof root.children.rest_res,'Child should not have child named \'rest_res\'.');
			done();
		});
    });

	// add child area 'area' to root
	describe('add child resource of type area to root', function() {
		it('root resource should have a child area resource named \'area\'', function(done) {
	        
			root.addChild('area_res',{
				type:'area'
			});
			
			assert('object',typeof root.children.area_res,'Root should have a child called area_res, but does not.');
			assert('area',root.children.area_res.type,'Child should have type \'area\', instead is ' +root.children.area_res.type);
			done();
		});
    });
*/
	
	/*describe('create a tree of resources with every resource type parent child combination', function(){
		it('root resource should have a child resource of every type and every child should have a child resource of every type', function(done) {
			
	        for(var i = 0; i < resourceTypes.length; i++){
				root.addChild({
					name: resourceTypes[i]+'_parent',
					type: resourceTypes[i]
				});
				
				assert(resourceTypes[i],root.children[resourceTypes[i]+'_parent'].type,"Couldn't add child to root of type "+ resourceTypes[i]);

				for ( var j = 0; j < resourceTypes.length; j++){
					root.children[resourceTypes[i]+'_parent'].addChild({
						name: resourceTypes[j]+'_child',
						type: resourceTypes[j]
					});
					
					assert(resourceTypes[j],root.children[resourceTypes[i]+'_parent'].children[resourceTypes[j]+'_child'].type,"Couldn't add child to "+resourceTypes[i]+'_parent'+" of type "+ resourceTypes[j]);
				}
			}
			
			done();
		});
		
	});*/

	// write a test to update every resource type based on it's config
	// write a test to delete every resource type
});