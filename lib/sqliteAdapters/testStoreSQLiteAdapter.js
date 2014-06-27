function transformResult(result) {
    try {
        var test = JSON.parse(result.test);
        test.id = result.id;
        return test;
    } catch(e) {
        return undefined;
    }
}

exports.Adapter = {
    name: 'tests',
    connected: function testStoreConnected(d){
        var self = this,
            done = d || function(){};

        self._db.run("CREATE TABLE IF NOT EXISTS tests (id INTEGER PRIMARY KEY, test TEXT NOT NULL);",function(err) {
            done(err);
        });
    },
    find: function testStoreFind(id,cb){
        var self = this;

        self._db.all('SELECT * from tests where id = ?;',[id],function(err,results){
            cb(err,transformResult(results[0]));
        });
    },
    findAll: function testStoreFindAll(cb){
        var self = this;

        self._db.all('SELECT * from tests;',function(err,results){
            var tests = [];
            results.forEach(function(result){
                tests.push(transformResult(result));
            });
            cb(err,tests);
        });
    },
    add: function testStoreAdd(test,cb){
        var self = this;

        self._db.run('INSERT into tests (test) VALUES(?);', JSON.stringify(test), function(err) {
            cb(err,this.lastID);
        });
    },
    replace: function testStoreReplace(test,cb){
        var self = this;

        self._db.run('UPDATE tests SET test = ? WHERE id = ?;', [JSON.stringify(test),test.id], function(err) {
            cb(err,this.changes);
        });
    },
    remove: function testStoreRemove(id,cb){
        var self = this;

        self._db.run('DELETE from tests where id = ?', [id], function(err){
            cb(err,this.changes);
        });
    }
};