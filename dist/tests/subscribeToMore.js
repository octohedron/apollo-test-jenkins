"use strict";
var chai_1 = require('chai');
var graphql_tag_1 = require('graphql-tag');
var apollo_client_1 = require('apollo-client');
var src_1 = require('../src');
describe('subscribeToMore', function () {
    var query = (_a = ["\n    query aQuery {\n      entry {\n        value\n      }\n    }\n  "], _a.raw = ["\n    query aQuery {\n      entry {\n        value\n      }\n    }\n  "], graphql_tag_1.default(_a));
    var result = {
        data: {
            entry: {
                value: 1,
            },
        },
    };
    var req1 = { request: { query: query }, result: result };
    var results = ['Dahivat Pandya', 'Amanda Liu'].map(function (name) { return ({ result: { name: name }, delay: 10 }); });
    var sub1 = {
        request: {
            query: (_b = ["\n        subscription newValues {\n          name\n        }\n      "], _b.raw = ["\n        subscription newValues {\n          name\n        }\n      "], graphql_tag_1.default(_b)),
        },
        id: 0,
        results: results.slice(),
    };
    var results2 = [
        { error: new Error('You cant touch this'), delay: 10 },
        { result: { name: 'Amanda Liu' }, delay: 10 },
    ];
    var sub2 = {
        request: {
            query: (_c = ["\n        subscription newValues {\n          notAnActualField\n        }\n      "], _c.raw = ["\n        subscription newValues {\n          notAnActualField\n        }\n      "], graphql_tag_1.default(_c)),
        },
        id: 0,
        results: results2.slice(),
    };
    var results3 = [
        { error: new Error('You cant touch this'), delay: 10 },
        { result: { name: 'Amanda Liu' }, delay: 10 },
    ];
    var sub3 = {
        request: {
            query: (_d = ["\n        subscription newValues {\n          notAnActualField\n        }\n      "], _d.raw = ["\n        subscription newValues {\n          notAnActualField\n        }\n      "], graphql_tag_1.default(_d)),
        },
        id: 0,
        results: results3.slice(),
    };
    it('triggers new result from subscription data', function (done) {
        var latestResult = null;
        var networkInterface = src_1.mockSubscriptionNetworkInterface([sub1], req1);
        var counter = 0;
        var client = new apollo_client_1.default({
            networkInterface: networkInterface,
            addTypename: false,
        });
        var obsHandle = client.watchQuery({
            query: query,
        });
        var sub = obsHandle.subscribe({
            next: function (queryResult) {
                latestResult = queryResult;
                counter++;
            },
        });
        obsHandle.subscribeToMore({
            document: (_a = ["\n        subscription newValues {\n          name\n        }\n      "], _a.raw = ["\n        subscription newValues {\n          name\n        }\n      "], graphql_tag_1.default(_a)),
            updateQuery: function (prev, _a) {
                var subscriptionData = _a.subscriptionData;
                return { entry: { value: subscriptionData.data.name } };
            },
        });
        setTimeout(function () {
            sub.unsubscribe();
            chai_1.assert.equal(counter, 3);
            chai_1.assert.deepEqual(latestResult, { data: { entry: { value: 'Amanda Liu' } }, loading: false, networkStatus: 7 });
            done();
        }, 50);
        for (var i = 0; i < 2; i++) {
            networkInterface.fireResult(0);
        }
        var _a;
    });
    it('calls error callback on error', function (done) {
        var latestResult = null;
        var networkInterface = src_1.mockSubscriptionNetworkInterface([sub2], req1);
        var counter = 0;
        var client = new apollo_client_1.default({
            networkInterface: networkInterface,
            addTypename: false,
        });
        var obsHandle = client.watchQuery({
            query: query,
        });
        var sub = obsHandle.subscribe({
            next: function (queryResult) {
                latestResult = queryResult;
                counter++;
            },
        });
        var errorCount = 0;
        obsHandle.subscribeToMore({
            document: (_a = ["\n        subscription newValues {\n          notAnActualField\n        }\n      "], _a.raw = ["\n        subscription newValues {\n          notAnActualField\n        }\n      "], graphql_tag_1.default(_a)),
            updateQuery: function (prev, _a) {
                var subscriptionData = _a.subscriptionData;
                return { entry: { value: subscriptionData.data.name } };
            },
            onError: function (err) { errorCount += 1; },
        });
        setTimeout(function () {
            sub.unsubscribe();
            chai_1.assert.equal(counter, 2);
            chai_1.assert.deepEqual(latestResult, { data: { entry: { value: 'Amanda Liu' } }, loading: false, networkStatus: 7 });
            chai_1.assert.equal(errorCount, 1);
            done();
        }, 50);
        for (var i = 0; i < 2; i++) {
            networkInterface.fireResult(0);
        }
        var _a;
    });
    it('prints unhandled subscription errors to the console', function (done) {
        var latestResult = null;
        var networkInterface = src_1.mockSubscriptionNetworkInterface([sub3], req1);
        var counter = 0;
        var client = new apollo_client_1.default({
            networkInterface: networkInterface,
            addTypename: false,
        });
        var obsHandle = client.watchQuery({
            query: query,
        });
        var sub = obsHandle.subscribe({
            next: function (queryResult) {
                latestResult = queryResult;
                counter++;
            },
        });
        var errorCount = 0;
        var consoleErr = console.error;
        console.error = function (err) { errorCount += 1; };
        obsHandle.subscribeToMore({
            document: (_a = ["\n        subscription newValues {\n          notAnActualField\n        }\n      "], _a.raw = ["\n        subscription newValues {\n          notAnActualField\n        }\n      "], graphql_tag_1.default(_a)),
            updateQuery: function (prev, _a) {
                var subscriptionData = _a.subscriptionData;
                return { entry: { value: subscriptionData.data.name } };
            },
        });
        setTimeout(function () {
            sub.unsubscribe();
            chai_1.assert.equal(counter, 2);
            chai_1.assert.deepEqual(latestResult, { data: { entry: { value: 'Amanda Liu' } }, loading: false, networkStatus: 7 });
            chai_1.assert.equal(errorCount, 1);
            console.error = consoleErr;
            done();
        }, 50);
        for (var i = 0; i < 2; i++) {
            networkInterface.fireResult(0);
        }
        var _a;
    });
    var _a, _b, _c, _d;
});
//# sourceMappingURL=subscribeToMore.js.map