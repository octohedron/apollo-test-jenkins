"use strict";
var wrap_1 = require('./wrap');
function subscribeAndCount(done, observable, cb) {
    var handleCount = 0;
    return observable.subscribe({
        next: wrap_1.wrap(done, function (result) {
            handleCount++;
            cb(handleCount, result);
        }),
        error: done,
    });
}
exports.subscribeAndCount = subscribeAndCount;
;
//# sourceMappingURL=subscribeAndCount.js.map