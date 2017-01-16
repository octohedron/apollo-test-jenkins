"use strict";
var chai_1 = require('chai');
var sinon_1 = require('sinon');
var graphql_tag_1 = require('graphql-tag');
var store_1 = require('apollo-client/queries/store');
var src_1 = require('../src');
describe('ObservableQuery', function () {
    var query = (_a = ["\n    query query($id: ID!) {\n      people_one(id: $id) {\n        name\n      }\n    }\n  "], _a.raw = ["\n    query query($id: ID!) {\n      people_one(id: $id) {\n        name\n      }\n    }\n  "], graphql_tag_1.default(_a));
    var superQuery = (_b = ["\n    query superQuery($id: ID!) {\n      people_one(id: $id) {\n        name\n        age\n      }\n    }\n  "], _b.raw = ["\n    query superQuery($id: ID!) {\n      people_one(id: $id) {\n        name\n        age\n      }\n    }\n  "], graphql_tag_1.default(_b));
    var variables = { id: 1 };
    var differentVariables = { id: 2 };
    var dataOne = {
        people_one: {
            name: 'Luke Skywalker',
        },
    };
    var superDataOne = {
        people_one: {
            name: 'Luke Skywalker',
            age: 21,
        },
    };
    var dataTwo = {
        people_one: {
            name: 'Leia Skywalker',
        },
    };
    var error = {
        name: 'people_one',
        message: 'is offline.',
    };
    describe('setOptions', function () {
        describe('to change pollInterval', function () {
            var timer;
            var defer = setImmediate;
            beforeEach(function () { return timer = sinon_1.useFakeTimers(); });
            afterEach(function () { return timer.restore(); });
            it('starts polling if goes from 0 -> something', function (done) {
                var manager = src_1.mockQueryManager({
                    request: { query: query, variables: variables },
                    result: { data: dataOne },
                }, {
                    request: { query: query, variables: variables },
                    result: { data: dataTwo },
                });
                var observable = manager.watchQuery({ query: query, variables: variables });
                src_1.subscribeAndCount(done, observable, function (handleCount, result) {
                    if (handleCount === 1) {
                        chai_1.assert.deepEqual(result.data, dataOne);
                        observable.setOptions({ pollInterval: 10 });
                        timer.tick(11);
                    }
                    else if (handleCount === 2) {
                        chai_1.assert.deepEqual(result.data, dataTwo);
                        done();
                    }
                });
                timer.tick(0);
            });
            it('stops polling if goes from something -> 0', function (done) {
                var manager = src_1.mockQueryManager({
                    request: { query: query, variables: variables },
                    result: { data: dataOne },
                }, {
                    request: { query: query, variables: variables },
                    result: { data: dataTwo },
                });
                var observable = manager.watchQuery({
                    query: query,
                    variables: variables,
                    pollInterval: 10,
                });
                src_1.subscribeAndCount(done, observable, function (handleCount, result) {
                    if (handleCount === 1) {
                        chai_1.assert.deepEqual(result.data, dataOne);
                        observable.setOptions({ pollInterval: 0 });
                        timer.tick(100);
                        done();
                    }
                    else if (handleCount === 2) {
                        done(new Error('Should not get more than one result'));
                    }
                });
                timer.tick(0);
            });
            it('can change from x>0 to y>0', function (done) {
                var manager = src_1.mockQueryManager({
                    request: { query: query, variables: variables },
                    result: { data: dataOne },
                }, {
                    request: { query: query, variables: variables },
                    result: { data: dataTwo },
                });
                var observable = manager.watchQuery({
                    query: query,
                    variables: variables,
                    pollInterval: 100,
                });
                src_1.subscribeAndCount(done, observable, function (handleCount, result) {
                    if (handleCount === 1) {
                        chai_1.assert.deepEqual(result.data, dataOne);
                        defer(function () {
                            observable.setOptions({ pollInterval: 10 });
                            defer(function () {
                                timer.tick(11);
                            });
                        });
                    }
                    else if (handleCount === 2) {
                        chai_1.assert.deepEqual(result.data, dataTwo);
                        done();
                    }
                });
                timer.tick(0);
            });
        });
        it('does not break refetch', function (done) {
            var queryWithVars = (_a = ["query people($first: Int) {\n        allPeople(first: $first) { people { name } }\n      }"], _a.raw = ["query people($first: Int) {\n        allPeople(first: $first) { people { name } }\n      }"], graphql_tag_1.default(_a));
            var data = { allPeople: { people: [{ name: 'Luke Skywalker' }] } };
            var variables1 = { first: 0 };
            var data2 = { allPeople: { people: [{ name: 'Leia Skywalker' }] } };
            var variables2 = { first: 1 };
            var observable = src_1.mockWatchQuery({
                request: { query: queryWithVars, variables: variables1 },
                result: { data: data },
            }, {
                request: { query: queryWithVars, variables: variables2 },
                result: { data: data2 },
            });
            src_1.subscribeAndCount(done, observable, function (handleCount, result) {
                if (handleCount === 1) {
                    chai_1.assert.deepEqual(result.data, data);
                    observable.setOptions({ forceFetch: false });
                    observable.refetch(variables2);
                }
                else if (handleCount === 3) {
                    chai_1.assert.deepEqual(result.data, data2);
                    done();
                }
            });
            var _a;
        });
        it('does a network request if forceFetch becomes true', function (done) {
            var observable = src_1.mockWatchQuery({
                request: { query: query, variables: variables },
                result: { data: dataOne },
            }, {
                request: { query: query, variables: variables },
                result: { data: dataTwo },
            });
            src_1.subscribeAndCount(done, observable, function (handleCount, result) {
                if (handleCount === 1) {
                    chai_1.assert.deepEqual(result.data, dataOne);
                    observable.setOptions({ forceFetch: true });
                }
                else if (handleCount === 2) {
                    chai_1.assert.deepEqual(result.data, dataTwo);
                    done();
                }
            });
        });
    });
    describe('setVariables', function () {
        it('reruns query if the variables change', function (done) {
            var observable = src_1.mockWatchQuery({
                request: { query: query, variables: variables },
                result: { data: dataOne },
            }, {
                request: { query: query, variables: differentVariables },
                result: { data: dataTwo },
            });
            src_1.subscribeAndCount(done, observable, function (handleCount, result) {
                if (handleCount === 1) {
                    chai_1.assert.deepEqual(result.data, dataOne);
                    observable.setVariables(differentVariables);
                }
                else if (handleCount === 2) {
                    chai_1.assert.isTrue(result.loading);
                    chai_1.assert.deepEqual(result.data, dataOne);
                }
                else if (handleCount === 3) {
                    chai_1.assert.isFalse(result.loading);
                    chai_1.assert.deepEqual(result.data, dataTwo);
                    done();
                }
            });
        });
        it('sets networkStatus to `setVariables` when fetching', function (done) {
            var mockedResponses = [{
                    request: { query: query, variables: variables },
                    result: { data: dataOne },
                }, {
                    request: { query: query, variables: differentVariables },
                    result: { data: dataTwo },
                }];
            var queryManager = src_1.mockQueryManager.apply(void 0, mockedResponses);
            var firstRequest = mockedResponses[0].request;
            var observable = queryManager.watchQuery({
                query: firstRequest.query,
                variables: firstRequest.variables,
                notifyOnNetworkStatusChange: true,
            });
            src_1.subscribeAndCount(done, observable, function (handleCount, result) {
                if (handleCount === 1) {
                    chai_1.assert.deepEqual(result.data, dataOne);
                    chai_1.assert.equal(result.networkStatus, store_1.NetworkStatus.ready);
                    observable.setVariables(differentVariables);
                }
                else if (handleCount === 2) {
                    chai_1.assert.isTrue(result.loading);
                    chai_1.assert.equal(result.networkStatus, store_1.NetworkStatus.setVariables);
                    chai_1.assert.deepEqual(result.data, dataOne);
                }
                else if (handleCount === 3) {
                    chai_1.assert.isFalse(result.loading);
                    chai_1.assert.equal(result.networkStatus, store_1.NetworkStatus.ready);
                    chai_1.assert.deepEqual(result.data, dataTwo);
                    done();
                }
            });
        });
        it('sets networkStatus to `setVariables` when calling refetch with new variables', function (done) {
            var mockedResponses = [{
                    request: { query: query, variables: variables },
                    result: { data: dataOne },
                }, {
                    request: { query: query, variables: differentVariables },
                    result: { data: dataTwo },
                }];
            var queryManager = src_1.mockQueryManager.apply(void 0, mockedResponses);
            var firstRequest = mockedResponses[0].request;
            var observable = queryManager.watchQuery({
                query: firstRequest.query,
                variables: firstRequest.variables,
                notifyOnNetworkStatusChange: true,
            });
            src_1.subscribeAndCount(done, observable, function (handleCount, result) {
                if (handleCount === 1) {
                    chai_1.assert.deepEqual(result.data, dataOne);
                    chai_1.assert.equal(result.networkStatus, store_1.NetworkStatus.ready);
                    observable.refetch(differentVariables);
                }
                else if (handleCount === 2) {
                    chai_1.assert.isTrue(result.loading);
                    chai_1.assert.equal(result.networkStatus, store_1.NetworkStatus.setVariables);
                    chai_1.assert.deepEqual(result.data, dataOne);
                }
                else if (handleCount === 3) {
                    chai_1.assert.isFalse(result.loading);
                    chai_1.assert.equal(result.networkStatus, store_1.NetworkStatus.ready);
                    chai_1.assert.deepEqual(result.data, dataTwo);
                    done();
                }
            });
        });
        it('reruns observer callback if the variables change but data does not', function (done) {
            var observable = src_1.mockWatchQuery({
                request: { query: query, variables: variables },
                result: { data: dataOne },
            }, {
                request: { query: query, variables: differentVariables },
                result: { data: dataOne },
            });
            src_1.subscribeAndCount(done, observable, function (handleCount, result) {
                if (handleCount === 1) {
                    chai_1.assert.deepEqual(result.data, dataOne);
                    observable.setVariables(differentVariables);
                }
                else if (handleCount === 2) {
                    chai_1.assert.isTrue(result.loading);
                    chai_1.assert.deepEqual(result.data, dataOne);
                }
                else if (handleCount === 3) {
                    chai_1.assert.deepEqual(result.data, dataOne);
                    done();
                }
            });
        });
        it('does not rerun observer callback if the variables change but new data is in store', function (done) {
            var manager = src_1.mockQueryManager({
                request: { query: query, variables: variables },
                result: { data: dataOne },
            }, {
                request: { query: query, variables: differentVariables },
                result: { data: dataOne },
            });
            manager.query({ query: query, variables: differentVariables })
                .then(function () {
                var observable = manager.watchQuery({ query: query, variables: variables });
                var errored = false;
                src_1.subscribeAndCount(done, observable, function (handleCount, result) {
                    if (handleCount === 1) {
                        chai_1.assert.deepEqual(result.data, dataOne);
                        observable.setVariables(differentVariables);
                        setTimeout(function () { return !errored && done(); }, 10);
                    }
                    else if (handleCount === 2) {
                        errored = true;
                        throw new Error('Observable callback should not fire twice');
                    }
                });
            });
        });
        it('does not rerun query if variables do not change', function (done) {
            var observable = src_1.mockWatchQuery({
                request: { query: query, variables: variables },
                result: { data: dataOne },
            }, {
                request: { query: query, variables: variables },
                result: { data: dataTwo },
            });
            var errored = false;
            src_1.subscribeAndCount(done, observable, function (handleCount, result) {
                if (handleCount === 1) {
                    chai_1.assert.deepEqual(result.data, dataOne);
                    observable.setVariables(variables);
                    setTimeout(function () { return !errored && done(); }, 10);
                }
                else if (handleCount === 2) {
                    errored = true;
                    throw new Error('Observable callback should not fire twice');
                }
            });
        });
        it('handles variables changing while a query is in-flight', function (done) {
            var observable = src_1.mockWatchQuery({
                request: { query: query, variables: variables },
                result: { data: dataOne },
                delay: 20,
            }, {
                request: { query: query, variables: differentVariables },
                result: { data: dataTwo },
                delay: 20,
            });
            setTimeout(function () { return observable.setVariables(differentVariables); }, 10);
            src_1.subscribeAndCount(done, observable, function (handleCount, result) {
                if (handleCount === 1) {
                    chai_1.assert.equal(result.networkStatus, store_1.NetworkStatus.ready);
                    chai_1.assert.isFalse(result.loading);
                    chai_1.assert.deepEqual(result.data, dataTwo);
                    done();
                }
            });
        });
    });
    describe('currentResult', function () {
        it('returns the current query status immediately', function (done) {
            var observable = src_1.mockWatchQuery({
                request: { query: query, variables: variables },
                result: { data: dataOne },
                delay: 100,
            });
            src_1.subscribeAndCount(done, observable, function () {
                chai_1.assert.deepEqual(observable.currentResult(), {
                    data: dataOne,
                    loading: false,
                    networkStatus: 7,
                });
                done();
            });
            chai_1.assert.deepEqual(observable.currentResult(), {
                loading: true,
                data: {},
                networkStatus: 1,
            });
            setTimeout(src_1.wrap(done, function () {
                chai_1.assert.deepEqual(observable.currentResult(), {
                    loading: true,
                    data: {},
                    networkStatus: 1,
                });
            }), 0);
        });
        it('returns results from the store immediately', function () {
            var queryManager = src_1.mockQueryManager({
                request: { query: query, variables: variables },
                result: { data: dataOne },
            });
            return queryManager.query({ query: query, variables: variables })
                .then(function (result) {
                chai_1.assert.deepEqual(result, {
                    data: dataOne,
                    loading: false,
                    networkStatus: 7,
                });
                var observable = queryManager.watchQuery({
                    query: query,
                    variables: variables,
                });
                chai_1.assert.deepEqual(observable.currentResult(), {
                    data: dataOne,
                    loading: false,
                    networkStatus: 7,
                });
            });
        });
        it('returns errors from the store immediately', function () {
            var queryManager = src_1.mockQueryManager({
                request: { query: query, variables: variables },
                result: { errors: [error] },
            });
            var observable = queryManager.watchQuery({
                query: query,
                variables: variables,
            });
            return observable.result()
                .catch(function (theError) {
                chai_1.assert.deepEqual(theError.graphQLErrors, [error]);
                var currentResult = observable.currentResult();
                chai_1.assert.equal(currentResult.loading, false);
                chai_1.assert.deepEqual(currentResult.error.graphQLErrors, [error]);
            });
        });
        it('returns partial data from the store immediately', function (done) {
            var queryManager = src_1.mockQueryManager({
                request: { query: query, variables: variables },
                result: { data: dataOne },
            }, {
                request: { query: superQuery, variables: variables },
                result: { data: superDataOne },
            });
            queryManager.query({ query: query, variables: variables })
                .then(function (result) {
                var observable = queryManager.watchQuery({
                    query: superQuery,
                    variables: variables,
                    returnPartialData: true,
                });
                chai_1.assert.deepEqual(observable.currentResult(), {
                    data: dataOne,
                    loading: true,
                    networkStatus: 1,
                });
                src_1.subscribeAndCount(done, observable, function (handleCount, subResult) {
                    chai_1.assert.deepEqual(subResult, observable.currentResult());
                    if (handleCount === 1) {
                        chai_1.assert.deepEqual(subResult, {
                            data: dataOne,
                            loading: true,
                            networkStatus: 1,
                        });
                    }
                    else if (handleCount === 2) {
                        chai_1.assert.deepEqual(subResult, {
                            data: superDataOne,
                            loading: false,
                            networkStatus: 7,
                        });
                        done();
                    }
                });
            });
        });
        it('returns loading even if full data is available when force fetching', function (done) {
            var queryManager = src_1.mockQueryManager({
                request: { query: query, variables: variables },
                result: { data: dataOne },
            }, {
                request: { query: query, variables: variables },
                result: { data: dataTwo },
            });
            queryManager.query({ query: query, variables: variables })
                .then(function (result) {
                var observable = queryManager.watchQuery({
                    query: query,
                    variables: variables,
                    forceFetch: true,
                });
                chai_1.assert.deepEqual(observable.currentResult(), {
                    data: dataOne,
                    loading: true,
                    networkStatus: 1,
                });
                src_1.subscribeAndCount(done, observable, function (handleCount, subResult) {
                    chai_1.assert.deepEqual(subResult, observable.currentResult());
                    if (handleCount === 1) {
                        chai_1.assert.deepEqual(subResult, {
                            data: dataTwo,
                            loading: false,
                            networkStatus: 7,
                        });
                        done();
                    }
                });
            });
        });
        describe('mutations', function () {
            var mutation = (_a = ["\n        mutation setName {\n          name\n        }\n      "], _a.raw = ["\n        mutation setName {\n          name\n        }\n      "], graphql_tag_1.default(_a));
            var mutationData = {
                name: 'Leia Skywalker',
            };
            var optimisticResponse = {
                name: 'Leia Skywalker (optimistic)',
            };
            var updateQueries = {
                query: function (previousQueryResult, _a) {
                    var mutationResult = _a.mutationResult;
                    return {
                        people_one: { name: mutationResult.data.name },
                    };
                },
            };
            it('returns optimistic mutation results from the store', function (done) {
                var queryManager = src_1.mockQueryManager({
                    request: { query: query, variables: variables },
                    result: { data: dataOne },
                }, {
                    request: { query: mutation },
                    result: { data: mutationData },
                });
                var observable = queryManager.watchQuery({
                    query: query,
                    variables: variables,
                });
                src_1.subscribeAndCount(done, observable, function (count, result) {
                    chai_1.assert.deepEqual(result, observable.currentResult());
                    if (count === 1) {
                        chai_1.assert.deepEqual(result, {
                            data: dataOne,
                            loading: false,
                            networkStatus: 7,
                        });
                        queryManager.mutate({ mutation: mutation, optimisticResponse: optimisticResponse, updateQueries: updateQueries });
                    }
                    else if (count === 2) {
                        chai_1.assert.deepEqual(result.data.people_one, optimisticResponse);
                    }
                    else if (count === 3) {
                        chai_1.assert.deepEqual(result.data.people_one, mutationData);
                        done();
                    }
                });
            });
            var _a;
        });
    });
    var _a, _b;
});
//# sourceMappingURL=ObservableQuery.js.map