"use strict";
var apollo_client_1 = require('apollo-client');
function isApolloClient(client) {
    return client instanceof apollo_client_1.ApolloClient;
}
exports.isApolloClient = isApolloClient;
var mockFetch_1 = require('./mocks/mockFetch');
exports.createMockFetch = mockFetch_1.createMockFetch;
exports.createMockedIResponse = mockFetch_1.createMockedIResponse;
var mockNetworkInterface_1 = require('./mocks/mockNetworkInterface');
exports.mockBatchedNetworkInterface = mockNetworkInterface_1.mockBatchedNetworkInterface;
exports.mockNetworkInterface = mockNetworkInterface_1.mockNetworkInterface;
exports.mockSubscriptionNetworkInterface = mockNetworkInterface_1.mockSubscriptionNetworkInterface;
var mockQueryManager_1 = require('./mocks/mockQueryManager');
exports.mockQueryManager = mockQueryManager_1.mockQueryManager;
var mockWatchQuery_1 = require('./mocks/mockWatchQuery');
exports.mockWatchQuery = mockWatchQuery_1.mockWatchQuery;
var wrap_1 = require('./util/wrap');
exports.wrap = wrap_1.wrap;
exports.withWarning = wrap_1.withWarning;
var subscribeAndCount_1 = require('./util/subscribeAndCount');
exports.subscribeAndCount = subscribeAndCount_1.subscribeAndCount;
var observableToPromise_1 = require('../src/util/observableToPromise');
exports.observableToPromise = observableToPromise_1.observableToPromise;
exports.observableToPromiseAndSubscription = observableToPromise_1.observableToPromiseAndSubscription;
//# sourceMappingURL=index.js.map