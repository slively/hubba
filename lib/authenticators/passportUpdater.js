var assert = require('assert-plus');

function PassportUpdater (opts){
    var o = opts || {};

    assert.object(o.passport,'passport');

    this.passport = o.passport;
}

PassportUpdater.prototype.update = function PassportUpdaterUpdate(opts) {
    var o = opts || {};

    assert.string(o.name,'name');
    this._remove(o);
    if (o.passportArgs) {
        this._add(o);
    }
};

PassportUpdater.prototype._add = function PassportUpdaterAdd(o) {
    this.passport.use.apply(this.passport,o.passportArgs);
};

PassportUpdater.prototype._remove = function PassportUpdaterRemove(o) {
    delete this.passport._strategies[o.name];
};

exports.PassportUpdater = PassportUpdater;