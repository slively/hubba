var assert = require("assert-plus"),
	Resource = require('../lib/resource'),
	root,
	area_child,
	area_child2,
	server = require('../lib/server').startup({
		port: 8081
	});

describe('Resource NODE API tests', function() {
	
	it(' should generate a root Resource.', function(done){
		root = Resource.generateResources();
		done();
	});
	
	it('root resource should throw an error when adding a child without a name', function(done) {
		assert.throws(function(){ root.addChild({ type : 'area', parentId: rootId }); });
		done();
	});
	
	it('root resource should throw an error when adding a child without a type', function(done) {
		assert.throws(function(){ root.addChild({ name : 'test', parentId: rootId }); });
		done();
	});
	
	it('root resource should throw an error when adding a child with a non-existent type.', function(done) {
		assert.throws(function(){ root.addChild({ name : 'test', type: 'this_does_not_exist', parentId: rootId }); });
		done();
	});
	
	it('root resource should add a child resource of type area with name "area_child"', function(done) {
		area_child = root.addChild({ name : 'area_child', type: 'area', parentId: root.id });
		assert.equal('area_child',root.children.area_child.name,"Area_child has the wrong name, supposed to be 'area_child', is actually " + root.children.area_child.type);
		assert.equal('area',root.children.area_child.type,"Area_child has the wrong type, supposed to be 'area' is actually " + root.children.area_child.type);
		assert.equal('/api/area_child',root.children.area_child.path,"Path is incorrect, should be /api/area_child, but is " + root.children.area_child.path);
		done();
	});
	
	it('area_child resource should add a child resource of type area with name "area_child2"', function(done) {
		area_child2 = area_child.addChild({ name : 'area_child2', type: 'area' });
		assert.equal('area_child2',root.children.area_child.children.area_child2.name,"Area_child has the wrong name, supposed to be 'area_child2', is actually " + root.children.area_child.children.area_child2.name);
		assert.equal('/api/area_child/area_child2',root.children.area_child.children.area_child2.path,"Path is incorrect, should be /api/area_child/area_child2, but is " + root.children.area_child.children.area_child2.path);
		done();
	});
	
	it('Resource.findById should find area_child.',function(done){
		var temp = Resource.findById(area_child.id);
		assert.equal(area_child.name,temp.name,"Retrieved resource has different name!");
		assert.equal(area_child.type,temp.type,"Retrieved resource has different type!");
		done();
	});
	
	it('Resource.findById should find area_child2.',function(done){
		var temp = Resource.findById(area_child2.id);
		assert.equal(area_child2.name,temp.name,"Retrieved resource has different name!");
		assert.equal(area_child2.type,temp.type,"Retrieved resource has different type!");
		done();
	});
	
	it('area_child should be renamed to area_child_r and the path should update for itself and all children.',function(done){
		root.children.area_child.update({ name: 'area_child_r' });
		assert.equal(undefined,root.children.area_child,'area_child should be an undefined child of root.');
		assert.equal('area_child_r',root.children.area_child_r.name);
		assert.equal('/api/area_child_r',root.children.area_child_r.path);
		assert.equal('/api/area_child_r/area_child2',root.children.area_child_r.children.area_child2.path);
		done();
	});
	
	it('area_child2 should be renamed to area_child2_r and the path should update for itself.',function(done){
		area_child2.update({ name: 'area_child2_r' });
		assert.equal(undefined,root.children.area_child_r.children.area_child2);
		assert.equal('area_child2_r',root.children.area_child_r.children.area_child2_r.name);
		assert.equal('/api/area_child_r/area_child2_r',root.children.area_child_r.children.area_child2_r.path);
		done();
	});
	
	it('The root resource should throw an error when attempting to delete.',function(done){
		assert.throws(function(){ root.del(); });
		done();
	});
	
	it('area_child should throw an error when attemping to delete because it has children.',function(done){
		assert.throws(function(){ root.children.area_child_r.del(); });
		done();
	});
	
	it('area_child2 should be deleted.',function(done){
		root.children.area_child_r.children.area_child2_r.del();
		assert.equal("undefined", typeof root.children.area_child_r.children.area_child2_r);
		done();
	});
	
	it('area_child should be deleted.',function(done){
		root.children.area_child_r.del();
		assert.equal("undefined", typeof root.children.area_child_r);
		done();
	});	
	
});