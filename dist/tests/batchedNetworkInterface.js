"use strict";
var chai_1 = require('chai');
var lodash_1 = require('lodash');
var batchedNetworkInterface_1 = require('apollo-client/transport/batchedNetworkInterface');
var networkInterface_1 = require('apollo-client/transport/networkInterface');
var graphql_tag_1 = require('graphql-tag');
var src_1 = require('../src');
describe('HTTPBatchedNetworkInterface', function () {
    var assertRoundtrip = function (_a) {
        var requestResultPairs = _a.requestResultPairs, fetchFunc = _a.fetchFunc, _b = _a.middlewares, middlewares = _b === void 0 ? [] : _b, _c = _a.afterwares, afterwares = _c === void 0 ? [] : _c, _d = _a.opts, opts = _d === void 0 ? {} : _d;
        var url = 'http://fake.com/graphql';
        var batchedNetworkInterface = new batchedNetworkInterface_1.HTTPBatchedNetworkInterface(url, 10, opts);
        batchedNetworkInterface.use(middlewares);
        batchedNetworkInterface.useAfter(afterwares);
        var printedRequests = [];
        var resultList = [];
        requestResultPairs.forEach(function (_a) {
            var request = _a.request, result = _a.result;
            printedRequests.push(networkInterface_1.printRequest(request));
            resultList.push(result);
        });
        fetch = fetchFunc || src_1.createMockFetch({
            url: url,
            opts: lodash_1.merge({
                body: JSON.stringify(printedRequests),
                headers: {
                    Accept: '*/*',
                    'Content-Type': 'application/json',
                },
                method: 'POST',
            }, opts),
            result: src_1.createMockedIResponse(resultList),
        });
        return batchedNetworkInterface.batchQuery(requestResultPairs.map(function (_a) {
            var request = _a.request;
            return request;
        }))
            .then(function (results) {
            chai_1.assert.deepEqual(results, resultList);
        });
    };
    var authorQuery = (_a = ["\n    query {\n      author {\n        firstName\n        lastName\n      }\n    }"], _a.raw = ["\n    query {\n      author {\n        firstName\n        lastName\n      }\n    }"], graphql_tag_1.default(_a));
    var authorResult = {
        data: {
            author: {
                firstName: 'John',
                lastName: 'Smith',
            },
        },
    };
    var personQuery = (_b = ["\n    query {\n      person {\n        name\n      }\n    }"], _b.raw = ["\n    query {\n      person {\n        name\n      }\n    }"], graphql_tag_1.default(_b));
    var personResult = {
        data: {
            person: {
                name: 'John Smith',
            },
        },
    };
    it('should construct itself correctly', function () {
        var url = 'http://notreal.com/graphql';
        var opts = {};
        var batchedNetworkInterface = new batchedNetworkInterface_1.HTTPBatchedNetworkInterface(url, 10, opts);
        chai_1.assert(batchedNetworkInterface);
        chai_1.assert.equal(batchedNetworkInterface._uri, url);
        chai_1.assert.deepEqual(batchedNetworkInterface._opts, opts);
        chai_1.assert(batchedNetworkInterface.batchQuery);
    });
    it('should correctly return the result for a single request', function () {
        return assertRoundtrip({
            requestResultPairs: [{
                    request: { query: authorQuery },
                    result: authorResult,
                }],
        });
    });
    it('should correctly return the results for multiple requests', function () {
        return assertRoundtrip({
            requestResultPairs: [
                {
                    request: { query: authorQuery },
                    result: authorResult,
                },
                {
                    request: { query: personQuery },
                    result: personResult,
                },
            ],
        });
    });
    describe('errors', function () {
        it('should return errors thrown by fetch', function (done) {
            var err = new Error('Error of some kind thrown by fetch.');
            var fetchFunc = function () { throw err; };
            assertRoundtrip({
                requestResultPairs: [{
                        request: { query: authorQuery },
                        result: authorResult,
                    }],
                fetchFunc: fetchFunc,
            }).then(function () {
                done(new Error('Assertion passed when it should not have.'));
            }).catch(function (error) {
                chai_1.assert(error);
                chai_1.assert.deepEqual(error, err);
                done();
            });
        });
        it('should return errors thrown by middleware', function (done) {
            var err = new Error('Error of some kind thrown by middleware.');
            var errorMiddleware = {
                applyMiddleware: function () {
                    throw err;
                },
            };
            assertRoundtrip({
                requestResultPairs: [{
                        request: { query: authorQuery },
                        result: authorResult,
                    }],
                middlewares: [errorMiddleware],
            }).then(function () {
                done(new Error('Returned a result when it should not have.'));
            }).catch(function (error) {
                chai_1.assert.deepEqual(error, err);
                done();
            });
        });
        it('should return errors thrown by afterware', function (done) {
            var err = new Error('Error of some kind thrown by afterware.');
            var errorAfterware = {
                applyAfterware: function () {
                    throw err;
                },
            };
            assertRoundtrip({
                requestResultPairs: [{
                        request: { query: authorQuery },
                        result: authorResult,
                    }],
                afterwares: [errorAfterware],
            }).then(function () {
                done(new Error('Returned a result when it should not have.'));
            }).catch(function (error) {
                chai_1.assert.deepEqual(error, err);
                done();
            });
        });
    });
    it('middleware should be able to modify requests/options', function () {
        var changeMiddleware = {
            applyMiddleware: function (_a, next) {
                var options = _a.options;
                options.headers['Content-Length'] = '18';
                next();
            },
        };
        var customHeaders = {
            'Content-Length': '18',
        };
        var options = { headers: customHeaders };
        return assertRoundtrip({
            requestResultPairs: [{
                    request: { query: authorQuery },
                    result: authorResult,
                }],
            opts: options,
            middlewares: [changeMiddleware],
        });
    });
    it('opts should be able to modify request headers and method (#920)', function () {
        var customHeaders = {
            Accept: 'application/json, text/plain, */*',
            'Content-Type': 'x-www-form-urlencoded',
        };
        var options = { method: 'GET', headers: customHeaders };
        return assertRoundtrip({
            requestResultPairs: [{
                    request: { query: authorQuery },
                    result: authorResult,
                }],
            opts: options,
        });
    });
    var _a, _b;
});
//# sourceMappingURL=batchedNetworkInterface.js.map