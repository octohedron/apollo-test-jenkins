"use strict";
var mockQueryManager_1 = require('./mockQueryManager');
exports.mockWatchQuery = function () {
    var mockedResponses = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        mockedResponses[_i - 0] = arguments[_i];
    }
    var queryManager = mockQueryManager_1.mockQueryManager.apply(void 0, mockedResponses);
    var firstRequest = mockedResponses[0].request;
    return queryManager.watchQuery({
        query: firstRequest.query,
        variables: firstRequest.variables,
    });
};
//# sourceMappingURL=mockWatchQuery.js.map