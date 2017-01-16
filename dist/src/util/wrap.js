"use strict";
var chai_1 = require('chai');
exports.wrap = function (done, cb) { return function () {
    var args = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        args[_i - 0] = arguments[_i];
    }
    try {
        return cb.apply(void 0, args);
    }
    catch (e) {
        done(e);
    }
}; };
function withWarning(func, regex) {
    var message;
    var oldWarn = console.warn;
    console.warn = function (m) { return message = m; };
    try {
        var result = func();
        chai_1.assert.match(message, regex);
        return result;
    }
    finally {
        console.warn = oldWarn;
    }
}
exports.withWarning = withWarning;
//# sourceMappingURL=wrap.js.map