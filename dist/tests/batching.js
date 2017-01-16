"use strict";
var chai_1 = require('chai');
var graphql_tag_1 = require('graphql-tag');
var batching_1 = require('apollo-client/transport/batching');
var src_1 = require('../src');
var networkInterface = src_1.mockBatchedNetworkInterface();
describe('QueryBatcher', function () {
    it('should construct', function () {
        chai_1.assert.doesNotThrow(function () {
            var querySched = new batching_1.QueryBatcher({
                batchFetchFunction: networkInterface.batchQuery.bind(networkInterface),
            });
            querySched.consumeQueue();
        });
    });
    it('should not do anything when faced with an empty queue', function () {
        var batcher = new batching_1.QueryBatcher({
            batchFetchFunction: networkInterface.batchQuery.bind(networkInterface),
        });
        chai_1.assert.equal(batcher.queuedRequests.length, 0);
        batcher.consumeQueue();
        chai_1.assert.equal(batcher.queuedRequests.length, 0);
    });
    it('should be able to add to the queue', function () {
        var batcher = new batching_1.QueryBatcher({
            batchFetchFunction: networkInterface.batchQuery.bind(networkInterface),
        });
        var query = (_a = ["\n      query {\n        author {\n          firstName\n          lastName\n        }\n      }"], _a.raw = ["\n      query {\n        author {\n          firstName\n          lastName\n        }\n      }"], graphql_tag_1.default(_a));
        var request = {
            request: { query: query },
        };
        chai_1.assert.equal(batcher.queuedRequests.length, 0);
        batcher.enqueueRequest(request);
        chai_1.assert.equal(batcher.queuedRequests.length, 1);
        batcher.enqueueRequest(request);
        chai_1.assert.equal(batcher.queuedRequests.length, 2);
        var _a;
    });
    describe('request queue', function () {
        var query = (_a = ["\n      query {\n        author {\n          firstName\n          lastName\n        }\n      }"], _a.raw = ["\n      query {\n        author {\n          firstName\n          lastName\n        }\n      }"], graphql_tag_1.default(_a));
        var data = {
            'author': {
                'firstName': 'John',
                'lastName': 'Smith',
            },
        };
        var myNetworkInterface = src_1.mockBatchedNetworkInterface({
            request: { query: query },
            result: { data: data },
        }, {
            request: { query: query },
            result: { data: data },
        });
        var batcher = new batching_1.QueryBatcher({
            batchFetchFunction: myNetworkInterface.batchQuery.bind(myNetworkInterface),
        });
        var request = {
            query: query,
        };
        it('should be able to consume from a queue containing a single query', function (done) {
            var myBatcher = new batching_1.QueryBatcher({
                batchFetchFunction: myNetworkInterface.batchQuery.bind(myNetworkInterface),
            });
            myBatcher.enqueueRequest(request);
            var promises = myBatcher.consumeQueue();
            chai_1.assert.equal(promises.length, 1);
            promises[0].then(function (resultObj) {
                chai_1.assert.equal(myBatcher.queuedRequests.length, 0);
                chai_1.assert.deepEqual(resultObj, { data: data });
                done();
            });
        });
        it('should be able to consume from a queue containing multiple queries', function (done) {
            var request2 = {
                query: query,
            };
            var NI = src_1.mockBatchedNetworkInterface({
                request: { query: query },
                result: { data: data },
            }, {
                request: { query: query },
                result: { data: data },
            });
            var myBatcher = new batching_1.QueryBatcher({
                batchFetchFunction: NI.batchQuery.bind(NI),
            });
            myBatcher.enqueueRequest(request);
            myBatcher.enqueueRequest(request2);
            var promises = myBatcher.consumeQueue();
            chai_1.assert.equal(batcher.queuedRequests.length, 0);
            chai_1.assert.equal(promises.length, 2);
            promises[0].then(function (resultObj1) {
                chai_1.assert.deepEqual(resultObj1, { data: data });
                promises[1].then(function (resultObj2) {
                    chai_1.assert.deepEqual(resultObj2, { data: data });
                    done();
                });
            });
        });
        it('should return a promise when we enqueue a request and resolve it with a result', function (done) {
            var NI = src_1.mockBatchedNetworkInterface({
                request: { query: query },
                result: { data: data },
            });
            var myBatcher = new batching_1.QueryBatcher({
                batchFetchFunction: NI.batchQuery.bind(NI),
            });
            var promise = myBatcher.enqueueRequest(request);
            myBatcher.consumeQueue();
            promise.then(function (result) {
                chai_1.assert.deepEqual(result, { data: data });
                done();
            });
        });
        var _a;
    });
    it('should be able to stop polling', function () {
        var batcher = new batching_1.QueryBatcher({
            batchFetchFunction: networkInterface.batchQuery.bind(networkInterface),
        });
        var query = (_a = ["\n      query {\n        author {\n          firstName\n          lastName\n        }\n      }"], _a.raw = ["\n      query {\n        author {\n          firstName\n          lastName\n        }\n      }"], graphql_tag_1.default(_a));
        var request = {
            query: query,
        };
        batcher.enqueueRequest(request);
        batcher.enqueueRequest(request);
        batcher.start(1000);
        batcher.stop();
        chai_1.assert.equal(batcher.queuedRequests.length, 2);
        var _a;
    });
    it('should reject the promise if there is a network error', function (done) {
        var query = (_a = ["\n      query {\n        author {\n          firstName\n          lastName\n        }\n      }"], _a.raw = ["\n      query {\n        author {\n          firstName\n          lastName\n        }\n      }"], graphql_tag_1.default(_a));
        var request = {
            query: query,
        };
        var error = new Error('Network error');
        var myNetworkInterface = src_1.mockBatchedNetworkInterface({
            request: { query: query },
            error: error,
        });
        var batcher = new batching_1.QueryBatcher({
            batchFetchFunction: myNetworkInterface.batchQuery.bind(myNetworkInterface),
        });
        var promise = batcher.enqueueRequest(request);
        batcher.consumeQueue();
        promise.catch(function (resError) {
            chai_1.assert.equal(resError.message, 'Network error');
            done();
        });
        var _a;
    });
});
//# sourceMappingURL=batching.js.map