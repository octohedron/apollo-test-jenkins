"use strict";
var lodash_1 = require('lodash');
var chai_1 = require('chai');
var graphql_tag_1 = require('graphql-tag');
var src_1 = require('../src');
describe('MockSubscriptionNetworkInterface', function () {
    var result1 = {
        result: {
            data: { user: { name: 'Dhaivat Pandya' } },
        },
        delay: 50,
    };
    var result2 = {
        result: {
            data: { user: { name: 'Vyacheslav Kim' } },
        },
        delay: 50,
    };
    var result3 = {
        result: {
            data: { user: { name: 'Changping Chen' } },
        },
        delay: 50,
    };
    var result4 = {
        result: {
            data: { user: { name: 'Amanda Liu' } },
        },
        delay: 50,
    };
    var sub1;
    beforeEach(function () {
        sub1 = {
            request: {
                query: (_a = ["\n          query UserInfo($name: String) {\n            user(name: $name) {\n              name\n            }\n          }\n        "], _a.raw = ["\n          query UserInfo($name: String) {\n            user(name: $name) {\n              name\n            }\n          }\n        "], graphql_tag_1.default(_a)),
                variables: {
                    name: 'Changping Chen',
                },
            },
            id: 0,
            results: [result1, result2, result3, result4],
        };
        var _a;
    });
    it('correctly adds mocked subscriptions', function () {
        var networkInterface = src_1.mockSubscriptionNetworkInterface([sub1]);
        var mockedSubscriptionsByKey = networkInterface.mockedSubscriptionsByKey;
        chai_1.assert.equal(Object.keys(mockedSubscriptionsByKey).length, 1);
        var key = Object.keys(mockedSubscriptionsByKey)[0];
        chai_1.assert.deepEqual(mockedSubscriptionsByKey[key], [sub1]);
    });
    it('correctly adds multiple mocked subscriptions', function () {
        var networkInterface = src_1.mockSubscriptionNetworkInterface([sub1, sub1]);
        var mockedSubscriptionsByKey = networkInterface.mockedSubscriptionsByKey;
        chai_1.assert.equal(Object.keys(mockedSubscriptionsByKey).length, 1);
        var key = Object.keys(mockedSubscriptionsByKey)[0];
        chai_1.assert.deepEqual(mockedSubscriptionsByKey[key], [sub1, sub1]);
    });
    it('throws an error when firing a result array is empty', function () {
        var noResultSub = lodash_1.omit(sub1, 'results');
        chai_1.assert.throw(function () {
            var networkInterface = src_1.mockSubscriptionNetworkInterface([noResultSub]);
            networkInterface.subscribe({
                query: (_a = ["\n            query UserInfo($name: String) {\n              user(name: $name) {\n                name\n              }\n            }\n          "], _a.raw = ["\n            query UserInfo($name: String) {\n              user(name: $name) {\n                name\n              }\n            }\n          "], graphql_tag_1.default(_a)),
                variables: {
                    name: 'Changping Chen',
                },
            }, function (error, result) {
                chai_1.assert.deepEqual(result, result1.result);
            });
            networkInterface.fireResult(0);
            var _a;
        });
    });
    it('throws an error when firing a subscription id that does not exist', function () {
        var noResultSub = lodash_1.omit(sub1, 'results');
        chai_1.assert.throw(function () {
            var networkInterface = src_1.mockSubscriptionNetworkInterface([noResultSub]);
            networkInterface.subscribe({
                query: (_a = ["\n            query UserInfo($name: String) {\n              user(name: $name) {\n                name\n              }\n            }\n          "], _a.raw = ["\n            query UserInfo($name: String) {\n              user(name: $name) {\n                name\n              }\n            }\n          "], graphql_tag_1.default(_a)),
                variables: {
                    name: 'Changping Chen',
                },
            }, function (error, result) {
                chai_1.assert.deepEqual(result, result1.result);
            });
            networkInterface.fireResult(4);
            var _a;
        });
    });
    it('correctly subscribes', function (done) {
        var networkInterface = src_1.mockSubscriptionNetworkInterface([sub1]);
        var id = networkInterface.subscribe({
            query: (_a = ["\n          query UserInfo($name: String) {\n            user(name: $name) {\n              name\n            }\n          }\n        "], _a.raw = ["\n          query UserInfo($name: String) {\n            user(name: $name) {\n              name\n            }\n          }\n        "], graphql_tag_1.default(_a)),
            variables: {
                name: 'Changping Chen',
            },
        }, function (error, result) {
            chai_1.assert.deepEqual(result, result1.result);
            done();
        });
        networkInterface.fireResult(0);
        chai_1.assert.equal(id, 0);
        chai_1.assert.deepEqual(networkInterface.mockedSubscriptionsById[0], sub1);
        var _a;
    });
    it('correctly fires results', function (done) {
        var networkInterface = src_1.mockSubscriptionNetworkInterface([sub1]);
        networkInterface.subscribe({
            query: (_a = ["\n          query UserInfo($name: String) {\n            user(name: $name) {\n              name\n            }\n          }\n        "], _a.raw = ["\n          query UserInfo($name: String) {\n            user(name: $name) {\n              name\n            }\n          }\n        "], graphql_tag_1.default(_a)),
            variables: {
                name: 'Changping Chen',
            },
        }, function (error, result) {
            chai_1.assert.deepEqual(result, result1.result);
            done();
        });
        networkInterface.fireResult(0);
        var _a;
    });
    it('correctly fires multiple results', function (done) {
        var allResults = [];
        var networkInterface = src_1.mockSubscriptionNetworkInterface([sub1]);
        networkInterface.subscribe({
            query: (_a = ["\n          query UserInfo($name: String) {\n            user(name: $name) {\n              name\n            }\n          }\n        "], _a.raw = ["\n          query UserInfo($name: String) {\n            user(name: $name) {\n              name\n            }\n          }\n        "], graphql_tag_1.default(_a)),
            variables: {
                name: 'Changping Chen',
            },
        }, function (error, result) {
            allResults.push(result);
        });
        for (var i = 0; i < 4; i++) {
            networkInterface.fireResult(0);
        }
        setTimeout(function () {
            chai_1.assert.deepEqual(allResults, [result1.result, result2.result, result3.result, result4.result]);
            done();
        }, 50);
        var _a;
    });
    it('correctly unsubscribes', function () {
        var networkInterface = src_1.mockSubscriptionNetworkInterface([sub1]);
        networkInterface.subscribe({
            query: (_a = ["\n          query UserInfo($name: String) {\n            user(name: $name) {\n              name\n            }\n          }\n        "], _a.raw = ["\n          query UserInfo($name: String) {\n            user(name: $name) {\n              name\n            }\n          }\n        "], graphql_tag_1.default(_a)),
            variables: {
                name: 'Changping Chen',
            },
        }, function (error, result) {
            chai_1.assert(false);
        });
        networkInterface.unsubscribe(0);
        chai_1.assert.throw(function () {
            networkInterface.fireResult(0);
        });
        var _a;
    });
});
//# sourceMappingURL=mockNetworkInterface.js.map