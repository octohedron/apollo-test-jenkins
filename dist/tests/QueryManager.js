"use strict";
var chai_1 = require('chai');
var lodash_1 = require('lodash');
var Rx = require('rxjs');
var redux_1 = require('redux');
var graphql_tag_1 = require('graphql-tag');
var QueryManager_1 = require('apollo-client/core/QueryManager');
var store_1 = require('apollo-client/queries/store');
var store_2 = require('apollo-client/store');
var extensions_1 = require('apollo-client/data/extensions');
var ApolloClient_1 = require('apollo-client/ApolloClient');
var src_1 = require('../src');
var src_2 = require('../src');
describe('QueryManager', function () {
    var dataIdFromObject = function (object) {
        if (object.__typename && object.id) {
            return object.__typename + '__' + object.id;
        }
        return undefined;
    };
    var defaultReduxRootSelector = function (state) { return state.apollo; };
    var createQueryManager = function (_a) {
        var networkInterface = _a.networkInterface, store = _a.store, reduxRootSelector = _a.reduxRootSelector, _b = _a.addTypename, addTypename = _b === void 0 ? false : _b;
        return new QueryManager_1.QueryManager({
            networkInterface: networkInterface || src_1.mockNetworkInterface(),
            store: store || store_2.createApolloStore(),
            reduxRootSelector: reduxRootSelector || defaultReduxRootSelector,
            addTypename: addTypename,
        });
    };
    var assertWithObserver = function (_a) {
        var done = _a.done, query = _a.query, _b = _a.variables, variables = _b === void 0 ? {} : _b, _c = _a.queryOptions, queryOptions = _c === void 0 ? {} : _c, result = _a.result, error = _a.error, delay = _a.delay, observer = _a.observer;
        var queryManager = src_1.mockQueryManager({
            request: { query: query, variables: variables },
            result: result,
            error: error,
            delay: delay,
        });
        var finalOptions = lodash_1.assign({ query: query, variables: variables }, queryOptions);
        return queryManager.watchQuery(finalOptions).subscribe({
            next: src_2.wrap(done, observer.next),
            error: observer.error,
        });
    };
    var assertRoundtrip = function (_a) {
        var done = _a.done, query = _a.query, data = _a.data, _b = _a.variables, variables = _b === void 0 ? {} : _b;
        assertWithObserver({
            done: done,
            query: query,
            result: { data: data },
            variables: variables,
            observer: {
                next: function (result) {
                    chai_1.assert.deepEqual(result.data, data, 'Roundtrip assertion failed.');
                    done();
                },
            },
        });
    };
    var mockMutation = function (_a) {
        var mutation = _a.mutation, data = _a.data, _b = _a.variables, variables = _b === void 0 ? {} : _b, store = _a.store;
        if (!store) {
            store = store_2.createApolloStore();
        }
        var networkInterface = src_1.mockNetworkInterface({
            request: { query: mutation, variables: variables },
            result: { data: data },
        });
        var queryManager = createQueryManager({ networkInterface: networkInterface, store: store });
        return new Promise(function (resolve, reject) {
            queryManager.mutate({ mutation: mutation, variables: variables }).then(function (result) {
                resolve({ result: result, queryManager: queryManager });
            }).catch(function (error) {
                reject(error);
            });
        });
    };
    var assertMutationRoundtrip = function (opts) {
        return mockMutation(opts).then(function (_a) {
            var result = _a.result;
            chai_1.assert.deepEqual(result.data, opts.data);
        });
    };
    var mockRefetch = function (_a) {
        var request = _a.request, firstResult = _a.firstResult, secondResult = _a.secondResult;
        return src_1.mockQueryManager({
            request: request,
            result: firstResult,
        }, {
            request: request,
            result: secondResult,
        });
    };
    it('properly roundtrips through a Redux store', function (done) {
        assertRoundtrip({
            query: (_a = ["\n      query people {\n        allPeople(first: 1) {\n          people {\n            name\n          }\n        }\n      }"], _a.raw = ["\n      query people {\n        allPeople(first: 1) {\n          people {\n            name\n          }\n        }\n      }"], graphql_tag_1.default(_a)),
            data: {
                allPeople: {
                    people: [
                        {
                            name: 'Luke Skywalker',
                        },
                    ],
                },
            },
            done: done,
        });
        var _a;
    });
    it('runs multiple root queries', function (done) {
        assertRoundtrip({
            query: (_a = ["\n      query people {\n        allPeople(first: 1) {\n          people {\n            name\n          }\n        }\n        person(id: \"1\") {\n          name\n        }\n      }\n    "], _a.raw = ["\n      query people {\n        allPeople(first: 1) {\n          people {\n            name\n          }\n        }\n        person(id: \"1\") {\n          name\n        }\n      }\n    "], graphql_tag_1.default(_a)),
            data: {
                allPeople: {
                    people: [
                        {
                            name: 'Luke Skywalker',
                        },
                    ],
                },
                person: {
                    name: 'Luke Skywalker',
                },
            },
            done: done,
        });
        var _a;
    });
    it('properly roundtrips through a Redux store with variables', function (done) {
        assertRoundtrip({
            query: (_a = ["\n      query people($firstArg: Int) {\n        allPeople(first: $firstArg) {\n          people {\n            name\n          }\n        }\n      }"], _a.raw = ["\n      query people($firstArg: Int) {\n        allPeople(first: $firstArg) {\n          people {\n            name\n          }\n        }\n      }"], graphql_tag_1.default(_a)),
            variables: {
                firstArg: 1,
            },
            data: {
                allPeople: {
                    people: [
                        {
                            name: 'Luke Skywalker',
                        },
                    ],
                },
            },
            done: done,
        });
        var _a;
    });
    it('handles GraphQL errors', function (done) {
        assertWithObserver({
            done: done,
            query: (_a = ["\n          query people {\n            allPeople(first: 1) {\n              people {\n                name\n              }\n            }\n          }"], _a.raw = ["\n          query people {\n            allPeople(first: 1) {\n              people {\n                name\n              }\n            }\n          }"], graphql_tag_1.default(_a)),
            variables: {},
            result: {
                errors: [
                    {
                        name: 'Name',
                        message: 'This is an error message.',
                    },
                ],
            },
            observer: {
                next: function (result) {
                    done(new Error('Returned a result when it was supposed to error out'));
                },
                error: function (apolloError) {
                    chai_1.assert(apolloError);
                    done();
                },
            },
        });
        var _a;
    });
    it('handles GraphQL errors with data returned', function (done) {
        assertWithObserver({
            done: done,
            query: (_a = ["\n      query people {\n        allPeople(first: 1) {\n          people {\n            name\n          }\n        }\n      }"], _a.raw = ["\n      query people {\n        allPeople(first: 1) {\n          people {\n            name\n          }\n        }\n      }"], graphql_tag_1.default(_a)),
            result: {
                data: {
                    allPeople: {
                        people: {
                            name: 'Ada Lovelace',
                        },
                    },
                },
                errors: [
                    {
                        name: 'Name',
                        message: 'This is an error message.',
                    },
                ],
            },
            observer: {
                next: function (result) {
                    done(new Error('Returned data when it was supposed to error out.'));
                },
                error: function (apolloError) {
                    chai_1.assert(apolloError);
                    done();
                },
            },
        });
        var _a;
    });
    it('empty error array (handle non-spec-compliant server) #156', function (done) {
        assertWithObserver({
            done: done,
            query: (_a = ["\n      query people {\n        allPeople(first: 1) {\n          people {\n            name\n          }\n        }\n      }"], _a.raw = ["\n      query people {\n        allPeople(first: 1) {\n          people {\n            name\n          }\n        }\n      }"], graphql_tag_1.default(_a)),
            result: {
                data: {
                    allPeople: {
                        people: {
                            name: 'Ada Lovelace',
                        },
                    },
                },
                errors: [],
            },
            observer: {
                next: function (result) {
                    chai_1.assert.equal(result.data['allPeople'].people.name, 'Ada Lovelace');
                    chai_1.assert.notProperty(result, 'errors');
                    done();
                },
            },
        });
        var _a;
    });
    it('handles network errors', function (done) {
        assertWithObserver({
            done: done,
            query: (_a = ["\n      query people {\n        allPeople(first: 1) {\n          people {\n            name\n          }\n        }\n      }"], _a.raw = ["\n      query people {\n        allPeople(first: 1) {\n          people {\n            name\n          }\n        }\n      }"], graphql_tag_1.default(_a)),
            error: new Error('Network error'),
            observer: {
                next: function (result) {
                    done(new Error('Should not deliver result'));
                },
                error: function (error) {
                    var apolloError = error;
                    chai_1.assert(apolloError.networkError);
                    chai_1.assert.include(apolloError.networkError.message, 'Network error');
                    done();
                },
            },
        });
        var _a;
    });
    it('uses console.error to log unhandled errors', function (done) {
        var oldError = console.error;
        var printed;
        console.error = function () {
            var args = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args[_i - 0] = arguments[_i];
            }
            printed = args;
        };
        assertWithObserver({
            done: done,
            query: (_a = ["\n      query people {\n        allPeople(first: 1) {\n          people {\n            name\n          }\n        }\n      }"], _a.raw = ["\n      query people {\n        allPeople(first: 1) {\n          people {\n            name\n          }\n        }\n      }"], graphql_tag_1.default(_a)),
            error: new Error('Network error'),
            observer: {
                next: function (result) {
                    done(new Error('Should not deliver result'));
                },
            },
        });
        setTimeout(function () {
            chai_1.assert.match(printed[0], /error/);
            console.error = oldError;
            done();
        }, 10);
        var _a;
    });
    it('handles an unsubscribe action that happens before data returns', function (done) {
        var subscription = assertWithObserver({
            done: done,
            query: (_a = ["\n      query people {\n        allPeople(first: 1) {\n          people {\n            name\n          }\n        }\n      }"], _a.raw = ["\n      query people {\n        allPeople(first: 1) {\n          people {\n            name\n          }\n        }\n      }"], graphql_tag_1.default(_a)),
            delay: 1000,
            observer: {
                next: function (result) {
                    done(new Error('Should not deliver result'));
                },
                error: function (error) {
                    done(new Error('Should not deliver result'));
                },
            },
        });
        chai_1.assert.doesNotThrow(subscription.unsubscribe);
        done();
        var _a;
    });
    it('supports interoperability with other Observable implementations like RxJS', function (done) {
        var expResult = {
            data: {
                allPeople: {
                    people: [
                        {
                            name: 'Luke Skywalker',
                        },
                    ],
                },
            },
        };
        var handle = src_1.mockWatchQuery({
            request: {
                query: (_a = ["\n          query people {\n            allPeople(first: 1) {\n              people {\n              name\n            }\n          }\n        }"], _a.raw = ["\n          query people {\n            allPeople(first: 1) {\n              people {\n              name\n            }\n          }\n        }"], graphql_tag_1.default(_a)),
            },
            result: expResult,
        });
        var observable = Rx.Observable.from(handle);
        observable
            .map(function (result) { return (lodash_1.assign({ fromRx: true }, result)); })
            .subscribe({
            next: src_2.wrap(done, function (newResult) {
                var expectedResult = lodash_1.assign({ fromRx: true, loading: false, networkStatus: 7 }, expResult);
                chai_1.assert.deepEqual(newResult, expectedResult);
                done();
            }),
        });
        var _a;
    });
    it('allows you to subscribe twice to the one query', function (done) {
        var request = {
            query: (_a = ["\n        query fetchLuke($id: String) {\n          people_one(id: $id) {\n            name\n          }\n        }"], _a.raw = ["\n        query fetchLuke($id: String) {\n          people_one(id: $id) {\n            name\n          }\n        }"], graphql_tag_1.default(_a)),
            variables: {
                id: '1',
            },
        };
        var data1 = {
            people_one: {
                name: 'Luke Skywalker',
            },
        };
        var data2 = {
            people_one: {
                name: 'Luke Skywalker has a new name',
            },
        };
        var data3 = {
            people_one: {
                name: 'Luke Skywalker has another name',
            },
        };
        var queryManager = src_1.mockQueryManager({
            request: request,
            result: { data: data1 },
        }, {
            request: request,
            result: { data: data2 },
            delay: 100,
        }, {
            request: request,
            result: { data: data3 },
        });
        var subOneCount = 0;
        queryManager.query(request)
            .then(function () {
            var handle = queryManager.watchQuery(request);
            var subOne = handle.subscribe({
                next: function (result) {
                    subOneCount++;
                    if (subOneCount === 1) {
                        chai_1.assert.deepEqual(result.data, data1);
                    }
                    else if (subOneCount === 2) {
                        chai_1.assert.deepEqual(result.data, data2);
                    }
                },
            });
            var subTwoCount = 0;
            handle.subscribe({
                next: function (result) {
                    subTwoCount++;
                    if (subTwoCount === 1) {
                        chai_1.assert.deepEqual(result.data, data1);
                        handle.refetch();
                    }
                    else if (subTwoCount === 2) {
                        chai_1.assert.deepEqual(result.data, data2);
                        setTimeout(function () {
                            try {
                                chai_1.assert.equal(subOneCount, 2);
                                subOne.unsubscribe();
                                handle.refetch();
                            }
                            catch (e) {
                                done(e);
                            }
                        }, 0);
                    }
                    else if (subTwoCount === 3) {
                        setTimeout(function () {
                            try {
                                chai_1.assert.equal(subOneCount, 2);
                                done();
                            }
                            catch (e) {
                                done(e);
                            }
                        }, 0);
                    }
                },
            });
        });
        var _a;
    });
    it('allows you to refetch queries', function () {
        var request = {
            query: (_a = ["\n        query fetchLuke($id: String) {\n          people_one(id: $id) {\n            name\n          }\n        }"], _a.raw = ["\n        query fetchLuke($id: String) {\n          people_one(id: $id) {\n            name\n          }\n        }"], graphql_tag_1.default(_a)),
            variables: {
                id: '1',
            },
        };
        var data1 = {
            people_one: {
                name: 'Luke Skywalker',
            },
        };
        var data2 = {
            people_one: {
                name: 'Luke Skywalker has a new name',
            },
        };
        var queryManager = mockRefetch({
            request: request,
            firstResult: { data: data1 },
            secondResult: { data: data2 },
        });
        var observable = queryManager.watchQuery(request);
        return src_2.observableToPromise({ observable: observable }, function (result) {
            chai_1.assert.deepEqual(result.data, data1);
            observable.refetch();
        }, function (result) { return chai_1.assert.deepEqual(result.data, data2); });
        var _a;
    });
    it('sets networkStatus to `refetch` when refetching', function () {
        var request = {
            query: (_a = ["\n        query fetchLuke($id: String) {\n          people_one(id: $id) {\n            name\n          }\n        }"], _a.raw = ["\n        query fetchLuke($id: String) {\n          people_one(id: $id) {\n            name\n          }\n        }"], graphql_tag_1.default(_a)),
            variables: {
                id: '1',
            },
            notifyOnNetworkStatusChange: true,
        };
        var data1 = {
            people_one: {
                name: 'Luke Skywalker',
            },
        };
        var data2 = {
            people_one: {
                name: 'Luke Skywalker has a new name',
            },
        };
        var queryManager = mockRefetch({
            request: request,
            firstResult: { data: data1 },
            secondResult: { data: data2 },
        });
        var observable = queryManager.watchQuery(request);
        return src_2.observableToPromise({ observable: observable }, function (result) {
            chai_1.assert.deepEqual(result.data, data1);
            observable.refetch();
        }, function (result) { return chai_1.assert.equal(result.networkStatus, store_1.NetworkStatus.refetch); }, function (result) {
            chai_1.assert.equal(result.networkStatus, store_1.NetworkStatus.ready);
            chai_1.assert.deepEqual(result.data, data2);
        });
        var _a;
    });
    it('allows you to refetch queries with promises', function () {
        var request = {
            query: (_a = ["\n      {\n        people_one(id: 1) {\n          name\n        }\n      }"], _a.raw = ["\n      {\n        people_one(id: 1) {\n          name\n        }\n      }"], graphql_tag_1.default(_a)),
        };
        var data1 = {
            people_one: {
                name: 'Luke Skywalker',
            },
        };
        var data2 = {
            people_one: {
                name: 'Luke Skywalker has a new name',
            },
        };
        var queryManager = mockRefetch({
            request: request,
            firstResult: { data: data1 },
            secondResult: { data: data2 },
        });
        var handle = queryManager.watchQuery(request);
        handle.subscribe({});
        return handle.refetch().then(function (result) { return chai_1.assert.deepEqual(result.data, data2); });
        var _a;
    });
    it('allows you to refetch queries with new variables', function () {
        var query = (_a = ["\n      {\n        people_one(id: 1) {\n          name\n        }\n      }\n    "], _a.raw = ["\n      {\n        people_one(id: 1) {\n          name\n        }\n      }\n    "], graphql_tag_1.default(_a));
        var data1 = {
            people_one: {
                name: 'Luke Skywalker',
            },
        };
        var data2 = {
            people_one: {
                name: 'Luke Skywalker has a new name',
            },
        };
        var data3 = {
            people_one: {
                name: 'Luke Skywalker has a new name and age',
            },
        };
        var data4 = {
            people_one: {
                name: 'Luke Skywalker has a whole new bag',
            },
        };
        var variables1 = {
            test: 'I am your father',
        };
        var variables2 = {
            test: "No. No! That's not true! That's impossible!",
        };
        var queryManager = src_1.mockQueryManager({
            request: { query: query },
            result: { data: data1 },
        }, {
            request: { query: query },
            result: { data: data2 },
        }, {
            request: { query: query, variables: variables1 },
            result: { data: data3 },
        }, {
            request: { query: query, variables: variables2 },
            result: { data: data4 },
        });
        var observable = queryManager.watchQuery({ query: query });
        return src_2.observableToPromise({ observable: observable }, function (result) {
            chai_1.assert.deepEqual(result.data, data1);
            observable.refetch();
        }, function (result) {
            chai_1.assert.deepEqual(result.data, data2);
            observable.refetch(variables1);
        }, function (result) {
            chai_1.assert.isTrue(result.loading);
            chai_1.assert.deepEqual(result.data, data2);
        }, function (result) {
            chai_1.assert.deepEqual(result.data, data3);
            observable.refetch(variables2);
        }, function (result) {
            chai_1.assert.isTrue(result.loading);
            chai_1.assert.deepEqual(result.data, data3);
        }, function (result) {
            chai_1.assert.deepEqual(result.data, data4);
        });
        var _a;
    });
    it('only modifies varaibles when refetching', function () {
        var query = (_a = ["\n      {\n        people_one(id: 1) {\n          name\n        }\n      }\n    "], _a.raw = ["\n      {\n        people_one(id: 1) {\n          name\n        }\n      }\n    "], graphql_tag_1.default(_a));
        var data1 = {
            people_one: {
                name: 'Luke Skywalker',
            },
        };
        var data2 = {
            people_one: {
                name: 'Luke Skywalker has a new name',
            },
        };
        var queryManager = src_1.mockQueryManager({
            request: { query: query },
            result: { data: data1 },
        }, {
            request: { query: query },
            result: { data: data2 },
        });
        var observable = queryManager.watchQuery({ query: query });
        var originalOptions = lodash_1.assign({}, observable.options);
        return src_2.observableToPromise({ observable: observable }, function (result) {
            chai_1.assert.deepEqual(result.data, data1);
            observable.refetch();
        }, function (result) {
            chai_1.assert.deepEqual(result.data, data2);
            var updatedOptions = lodash_1.assign({}, observable.options);
            delete originalOptions.variables;
            delete updatedOptions.variables;
            chai_1.assert.deepEqual(updatedOptions, originalOptions);
        });
        var _a;
    });
    it('continues to poll after refetch', function () {
        var query = (_a = ["\n      {\n        people_one(id: 1) {\n          name\n        }\n      }\n    "], _a.raw = ["\n      {\n        people_one(id: 1) {\n          name\n        }\n      }\n    "], graphql_tag_1.default(_a));
        var data1 = {
            people_one: {
                name: 'Luke Skywalker',
            },
        };
        var data2 = {
            people_one: {
                name: 'Luke Skywalker has a new name',
            },
        };
        var data3 = {
            people_one: {
                name: 'Patsy',
            },
        };
        var queryManager = src_1.mockQueryManager({
            request: { query: query },
            result: { data: data1 },
        }, {
            request: { query: query },
            result: { data: data2 },
        }, {
            request: { query: query },
            result: { data: data3 },
        });
        var observable = queryManager.watchQuery({
            query: query,
            pollInterval: 200,
        });
        return src_2.observableToPromise({ observable: observable }, function (result) {
            chai_1.assert.deepEqual(result.data, data1);
            observable.refetch();
        }, function (result) { return chai_1.assert.deepEqual(result.data, data2); }, function (result) {
            chai_1.assert.deepEqual(result.data, data3);
            observable.stopPolling();
            chai_1.assert(result);
        });
        var _a;
    });
    it('sets networkStatus to `poll` if a polling query is in flight', function (done) {
        var query = (_a = ["\n      {\n        people_one(id: 1) {\n          name\n        }\n      }\n    "], _a.raw = ["\n      {\n        people_one(id: 1) {\n          name\n        }\n      }\n    "], graphql_tag_1.default(_a));
        var data1 = {
            people_one: {
                name: 'Luke Skywalker',
            },
        };
        var data2 = {
            people_one: {
                name: 'Luke Skywalker has a new name',
            },
        };
        var data3 = {
            people_one: {
                name: 'Patsy',
            },
        };
        var queryManager = src_1.mockQueryManager({
            request: { query: query },
            result: { data: data1 },
        }, {
            request: { query: query },
            result: { data: data2 },
        }, {
            request: { query: query },
            result: { data: data3 },
        });
        var observable = queryManager.watchQuery({
            query: query,
            pollInterval: 30,
            notifyOnNetworkStatusChange: true,
        });
        var counter = 0;
        var handle = observable.subscribe({
            next: function (result) {
                counter += 1;
                if (counter === 1) {
                    chai_1.assert.equal(result.networkStatus, store_1.NetworkStatus.ready);
                }
                else if (counter === 2) {
                    chai_1.assert.equal(result.networkStatus, store_1.NetworkStatus.poll);
                    handle.unsubscribe();
                    done();
                }
            },
        });
        var _a;
    });
    it('supports returnPartialData #193', function () {
        var primeQuery = (_a = ["\n      query primeQuery {\n        people_one(id: 1) {\n          name\n        }\n      }\n    "], _a.raw = ["\n      query primeQuery {\n        people_one(id: 1) {\n          name\n        }\n      }\n    "], graphql_tag_1.default(_a));
        var complexQuery = (_b = ["\n      query complexQuery {\n        luke: people_one(id: 1) {\n          name\n        }\n        vader: people_one(id: 4) {\n          name\n        }\n      }\n    "], _b.raw = ["\n      query complexQuery {\n        luke: people_one(id: 1) {\n          name\n        }\n        vader: people_one(id: 4) {\n          name\n        }\n      }\n    "], graphql_tag_1.default(_b));
        var diffedQuery = (_c = ["\n      query complexQuery {\n        vader: people_one(id: 4) {\n          name\n        }\n      }\n    "], _c.raw = ["\n      query complexQuery {\n        vader: people_one(id: 4) {\n          name\n        }\n      }\n    "], graphql_tag_1.default(_c));
        var data1 = {
            people_one: {
                name: 'Luke Skywalker',
            },
        };
        var data2 = {
            vader: {
                name: 'Darth Vader',
            },
        };
        var queryManager = src_1.mockQueryManager({
            request: { query: primeQuery },
            result: { data: data1 },
        }, {
            request: { query: diffedQuery },
            result: { data: data2 },
            delay: 5,
        });
        return queryManager.query({
            query: primeQuery,
        }).then(function () {
            var handle = queryManager.watchQuery({
                query: complexQuery,
                returnPartialData: true,
            });
            return handle.result().then(function (result) {
                chai_1.assert.equal(result.data['luke'].name, 'Luke Skywalker');
                chai_1.assert.notProperty(result.data, 'vader');
            });
        });
        var _a, _b, _c;
    });
    it('should error if we pass noFetch on a polling query', function (done) {
        chai_1.assert.throw(function () {
            assertWithObserver({
                done: done,
                observer: {
                    next: function (result) {
                        done(new Error('Returned a result when it should not have.'));
                    },
                },
                query: (_a = ["\n          query {\n            author {\n              firstName\n              lastName\n            }\n          }"], _a.raw = ["\n          query {\n            author {\n              firstName\n              lastName\n            }\n          }"], graphql_tag_1.default(_a)),
                queryOptions: { pollInterval: 200, noFetch: true },
            });
            var _a;
        });
        done();
    });
    it('supports noFetch fetching only cached data', function () {
        var primeQuery = (_a = ["\n      query primeQuery {\n        luke: people_one(id: 1) {\n          name\n        }\n      }\n    "], _a.raw = ["\n      query primeQuery {\n        luke: people_one(id: 1) {\n          name\n        }\n      }\n    "], graphql_tag_1.default(_a));
        var complexQuery = (_b = ["\n      query complexQuery {\n        luke: people_one(id: 1) {\n          name\n        }\n        vader: people_one(id: 4) {\n          name\n        }\n      }\n    "], _b.raw = ["\n      query complexQuery {\n        luke: people_one(id: 1) {\n          name\n        }\n        vader: people_one(id: 4) {\n          name\n        }\n      }\n    "], graphql_tag_1.default(_b));
        var data1 = {
            luke: {
                name: 'Luke Skywalker',
            },
        };
        var queryManager = src_1.mockQueryManager({
            request: { query: primeQuery },
            result: { data: data1 },
        });
        return queryManager.query({
            query: primeQuery,
        }).then(function () {
            var handle = queryManager.watchQuery({
                query: complexQuery,
                noFetch: true,
            });
            return handle.result().then(function (result) {
                chai_1.assert.equal(result.data['luke'].name, 'Luke Skywalker');
                chai_1.assert.notProperty(result.data, 'vader');
            });
        });
        var _a, _b;
    });
    it('runs a mutation', function () {
        return assertMutationRoundtrip({
            mutation: (_a = ["\n        mutation makeListPrivate {\n          makeListPrivate(id: \"5\")\n        }"], _a.raw = ["\n        mutation makeListPrivate {\n          makeListPrivate(id: \"5\")\n        }"], graphql_tag_1.default(_a)),
            data: { makeListPrivate: true },
        });
        var _a;
    });
    it('runs a mutation with variables', function () {
        return assertMutationRoundtrip({
            mutation: (_a = ["\n        mutation makeListPrivate($listId: ID!) {\n          makeListPrivate(id: $listId)\n        }"], _a.raw = ["\n        mutation makeListPrivate($listId: ID!) {\n          makeListPrivate(id: $listId)\n        }"], graphql_tag_1.default(_a)),
            variables: { listId: '1' },
            data: { makeListPrivate: true },
        });
        var _a;
    });
    it('runs a mutation with object parameters and puts the result in the store', function () {
        var data = {
            makeListPrivate: {
                id: '5',
                isPrivate: true,
            },
        };
        return mockMutation({
            mutation: (_a = ["\n        mutation makeListPrivate {\n          makeListPrivate(input: {id: \"5\"}) {\n            id,\n            isPrivate,\n          }\n        }"], _a.raw = ["\n        mutation makeListPrivate {\n          makeListPrivate(input: {id: \"5\"}) {\n            id,\n            isPrivate,\n          }\n        }"], graphql_tag_1.default(_a)),
            data: data,
            store: store_2.createApolloStore({
                config: { dataIdFromObject: extensions_1.getIdField },
            }),
        }).then(function (_a) {
            var result = _a.result, queryManager = _a.queryManager;
            chai_1.assert.deepEqual(result.data, data);
            chai_1.assert.deepEqual(queryManager.store.getState()['apollo'].data['5'], { id: '5', isPrivate: true });
        });
        var _a;
    });
    it('runs a mutation and puts the result in the store', function () {
        var data = {
            makeListPrivate: {
                id: '5',
                isPrivate: true,
            },
        };
        return mockMutation({
            mutation: (_a = ["\n        mutation makeListPrivate {\n          makeListPrivate(id: \"5\") {\n            id,\n            isPrivate,\n          }\n        }"], _a.raw = ["\n        mutation makeListPrivate {\n          makeListPrivate(id: \"5\") {\n            id,\n            isPrivate,\n          }\n        }"], graphql_tag_1.default(_a)),
            data: data,
            store: store_2.createApolloStore({
                config: { dataIdFromObject: extensions_1.getIdField },
            }),
        }).then(function (_a) {
            var result = _a.result, queryManager = _a.queryManager;
            chai_1.assert.deepEqual(result.data, data);
            chai_1.assert.deepEqual(queryManager.store.getState()['apollo'].data['5'], { id: '5', isPrivate: true });
        });
        var _a;
    });
    it('runs a mutation and puts the result in the store with root key', function () {
        var mutation = (_a = ["\n      mutation makeListPrivate {\n        makeListPrivate(id: \"5\") {\n          id,\n          isPrivate,\n        }\n      }\n    "], _a.raw = ["\n      mutation makeListPrivate {\n        makeListPrivate(id: \"5\") {\n          id,\n          isPrivate,\n        }\n      }\n    "], graphql_tag_1.default(_a));
        var data = {
            makeListPrivate: {
                id: '5',
                isPrivate: true,
            },
        };
        var reduxRootKey = 'test';
        var reduxRootSelector = function (state) { return state[reduxRootKey]; };
        var store = store_2.createApolloStore({
            reduxRootKey: reduxRootKey,
            config: { dataIdFromObject: extensions_1.getIdField },
        });
        var queryManager = createQueryManager({
            networkInterface: src_1.mockNetworkInterface({
                request: { query: mutation },
                result: { data: data },
            }),
            store: store,
            reduxRootSelector: reduxRootSelector,
        });
        return queryManager.mutate({
            mutation: mutation,
        }).then(function (result) {
            chai_1.assert.deepEqual(result.data, data);
            chai_1.assert.deepEqual(reduxRootSelector(store.getState()).data['5'], { id: '5', isPrivate: true });
        });
        var _a;
    });
    it('does not broadcast queries when non-apollo actions are dispatched', function () {
        var query = (_a = ["\n      query fetchLuke($id: String) {\n        people_one(id: $id) {\n          name\n        }\n      }\n    "], _a.raw = ["\n      query fetchLuke($id: String) {\n        people_one(id: $id) {\n          name\n        }\n      }\n    "], graphql_tag_1.default(_a));
        var variables = {
            id: '1',
        };
        var data1 = {
            people_one: {
                name: 'Luke Skywalker',
            },
        };
        var data2 = {
            people_one: {
                name: 'Luke Skywalker has a new name',
            },
        };
        function testReducer(state, action) {
            if (state === void 0) { state = false; }
            if (action.type === 'TOGGLE') {
                return true;
            }
            return state;
        }
        var client = new ApolloClient_1.default();
        var store = redux_1.createStore(redux_1.combineReducers({
            test: testReducer,
            apollo: client.reducer(),
        }), redux_1.applyMiddleware(client.middleware()));
        var observable = createQueryManager({
            networkInterface: src_1.mockNetworkInterface({
                request: { query: query, variables: variables },
                result: { data: data1 },
            }, {
                request: { query: query, variables: variables },
                result: { data: data2 },
            }),
            store: store,
        }).watchQuery({ query: query, variables: variables });
        return src_2.observableToPromise({ observable: observable }, function (result) {
            chai_1.assert.deepEqual(result.data, data1);
            observable.refetch();
        }, function (result) {
            chai_1.assert.deepEqual(result.data, data2);
            store.dispatch({
                type: 'TOGGLE',
            });
        });
        var _a;
    });
    it("doesn't return data while query is loading", function () {
        var query1 = (_a = ["\n      {\n        people_one(id: 1) {\n          name\n        }\n      }\n    "], _a.raw = ["\n      {\n        people_one(id: 1) {\n          name\n        }\n      }\n    "], graphql_tag_1.default(_a));
        var data1 = {
            people_one: {
                name: 'Luke Skywalker',
            },
        };
        var query2 = (_b = ["\n      {\n        people_one(id: 5) {\n          name\n        }\n      }\n    "], _b.raw = ["\n      {\n        people_one(id: 5) {\n          name\n        }\n      }\n    "], graphql_tag_1.default(_b));
        var data2 = {
            people_one: {
                name: 'Darth Vader',
            },
        };
        var queryManager = src_1.mockQueryManager({
            request: { query: query1 },
            result: { data: data1 },
            delay: 10,
        }, {
            request: { query: query2 },
            result: { data: data2 },
        });
        var observable1 = queryManager.watchQuery({ query: query1 });
        var observable2 = queryManager.watchQuery({ query: query2 });
        return Promise.all([
            src_2.observableToPromise({ observable: observable1 }, function (result) { return chai_1.assert.deepEqual(result.data, data1); }),
            src_2.observableToPromise({ observable: observable2 }, function (result) { return chai_1.assert.deepEqual(result.data, data2); }),
        ]);
        var _a, _b;
    });
    it("updates result of previous query if the result of a new query overlaps", function () {
        var query1 = (_a = ["\n      {\n        people_one(id: 1) {\n          name\n          age\n        }\n      }\n    "], _a.raw = ["\n      {\n        people_one(id: 1) {\n          name\n          age\n        }\n      }\n    "], graphql_tag_1.default(_a));
        var data1 = {
            people_one: {
                name: 'Luke Skywalker',
                age: 50,
            },
        };
        var query2 = (_b = ["\n      {\n        people_one(id: 1) {\n          name\n          username\n        }\n      }\n    "], _b.raw = ["\n      {\n        people_one(id: 1) {\n          name\n          username\n        }\n      }\n    "], graphql_tag_1.default(_b));
        var data2 = {
            people_one: {
                name: 'Luke Skywalker has a new name',
                username: 'luke',
            },
        };
        var queryManager = src_1.mockQueryManager({
            request: { query: query1 },
            result: { data: data1 },
        }, {
            request: { query: query2 },
            result: { data: data2 },
            delay: 10,
        });
        var observable = queryManager.watchQuery({ query: query1 });
        return src_2.observableToPromise({ observable: observable }, function (result) {
            chai_1.assert.deepEqual(result.data, data1);
            queryManager.query({ query: query2 });
        }, function (result) { return chai_1.assert.deepEqual(result.data, {
            people_one: {
                name: 'Luke Skywalker has a new name',
                age: 50,
            },
        }); });
        var _a, _b;
    });
    describe('polling queries', function () {
        it('allows you to poll queries', function () {
            var query = (_a = ["\n        query fetchLuke($id: String) {\n          people_one(id: $id) {\n            name\n          }\n        }\n      "], _a.raw = ["\n        query fetchLuke($id: String) {\n          people_one(id: $id) {\n            name\n          }\n        }\n      "], graphql_tag_1.default(_a));
            var variables = {
                id: '1',
            };
            var data1 = {
                people_one: {
                    name: 'Luke Skywalker',
                },
            };
            var data2 = {
                people_one: {
                    name: 'Luke Skywalker has a new name',
                },
            };
            var queryManager = src_1.mockQueryManager({
                request: { query: query, variables: variables },
                result: { data: data1 },
            }, {
                request: { query: query, variables: variables },
                result: { data: data2 },
            });
            var observable = queryManager.watchQuery({
                query: query,
                variables: variables,
                pollInterval: 50,
            });
            return src_2.observableToPromise({ observable: observable }, function (result) { return chai_1.assert.deepEqual(result.data, data1); }, function (result) { return chai_1.assert.deepEqual(result.data, data2); });
            var _a;
        });
        it('should let you handle multiple polled queries and unsubscribe from one of them', function (done) {
            var query1 = (_a = ["\n        query {\n          author {\n            firstName\n            lastName\n          }\n        }"], _a.raw = ["\n        query {\n          author {\n            firstName\n            lastName\n          }\n        }"], graphql_tag_1.default(_a));
            var query2 = (_b = ["\n        query {\n          person {\n            name\n          }\n        }"], _b.raw = ["\n        query {\n          person {\n            name\n          }\n        }"], graphql_tag_1.default(_b));
            var data11 = {
                author: {
                    firstName: 'John',
                    lastName: 'Smith',
                },
            };
            var data12 = {
                author: {
                    firstName: 'Jack',
                    lastName: 'Smith',
                },
            };
            var data13 = {
                author: {
                    firstName: 'Jolly',
                    lastName: 'Smith',
                },
            };
            var data14 = {
                author: {
                    firstName: 'Jared',
                    lastName: 'Smith',
                },
            };
            var data21 = {
                person: {
                    name: 'Jane Smith',
                },
            };
            var data22 = {
                person: {
                    name: 'Josey Smith',
                },
            };
            var queryManager = src_1.mockQueryManager({
                request: { query: query1 },
                result: { data: data11 },
            }, {
                request: { query: query1 },
                result: { data: data12 },
            }, {
                request: { query: query1 },
                result: { data: data13 },
            }, {
                request: { query: query1 },
                result: { data: data14 },
            }, {
                request: { query: query2 },
                result: { data: data21 },
            }, {
                request: { query: query2 },
                result: { data: data22 },
            });
            var handle1Count = 0;
            var handleCount = 0;
            var setMilestone = false;
            var subscription1 = queryManager.watchQuery({
                query: query1,
                pollInterval: 150,
            }).subscribe({
                next: function (result) {
                    handle1Count++;
                    handleCount++;
                    if (handle1Count > 1 && !setMilestone) {
                        subscription1.unsubscribe();
                        setMilestone = true;
                    }
                },
            });
            var subscription2 = queryManager.watchQuery({
                query: query2,
                pollInterval: 2000,
            }).subscribe({
                next: function (result) {
                    handleCount++;
                },
            });
            setTimeout(function () {
                chai_1.assert.equal(handleCount, 3);
                subscription1.unsubscribe();
                subscription2.unsubscribe();
                done();
            }, 400);
            var _a, _b;
        });
        it('allows you to unsubscribe from polled queries', function () {
            var query = (_a = ["\n        query fetchLuke($id: String) {\n          people_one(id: $id) {\n            name\n          }\n        }\n      "], _a.raw = ["\n        query fetchLuke($id: String) {\n          people_one(id: $id) {\n            name\n          }\n        }\n      "], graphql_tag_1.default(_a));
            var variables = {
                id: '1',
            };
            var data1 = {
                people_one: {
                    name: 'Luke Skywalker',
                },
            };
            var data2 = {
                people_one: {
                    name: 'Luke Skywalker has a new name',
                },
            };
            var queryManager = src_1.mockQueryManager({
                request: { query: query, variables: variables },
                result: { data: data1 },
            }, {
                request: { query: query, variables: variables },
                result: { data: data2 },
            });
            var observable = queryManager.watchQuery({
                query: query,
                variables: variables,
                pollInterval: 50,
            });
            var _b = src_2.observableToPromiseAndSubscription({
                observable: observable,
                wait: 60,
            }, function (result) { return chai_1.assert.deepEqual(result.data, data1); }, function (result) {
                chai_1.assert.deepEqual(result.data, data2);
                subscription.unsubscribe();
            }), promise = _b.promise, subscription = _b.subscription;
            return promise;
            var _a;
        });
        it('allows you to unsubscribe from polled query errors', function () {
            var query = (_a = ["\n        query fetchLuke($id: String) {\n          people_one(id: $id) {\n            name\n          }\n        }\n      "], _a.raw = ["\n        query fetchLuke($id: String) {\n          people_one(id: $id) {\n            name\n          }\n        }\n      "], graphql_tag_1.default(_a));
            var variables = {
                id: '1',
            };
            var data1 = {
                people_one: {
                    name: 'Luke Skywalker',
                },
            };
            var data2 = {
                people_one: {
                    name: 'Luke Skywalker has a new name',
                },
            };
            var queryManager = src_1.mockQueryManager({
                request: { query: query, variables: variables },
                result: { data: data1 },
            }, {
                request: { query: query, variables: variables },
                error: new Error('Network error'),
            }, {
                request: { query: query, variables: variables },
                result: { data: data2 },
            });
            var observable = queryManager.watchQuery({
                query: query,
                variables: variables,
                pollInterval: 50,
            });
            var _b = src_2.observableToPromiseAndSubscription({
                observable: observable,
                wait: 60,
                errorCallbacks: [
                    function (error) {
                        chai_1.assert.include(error.message, 'Network error');
                        subscription.unsubscribe();
                    },
                ],
            }, function (result) { return chai_1.assert.deepEqual(result.data, data1); }), promise = _b.promise, subscription = _b.subscription;
            return promise;
            var _a;
        });
        it('exposes a way to start a polling query', function () {
            var query = (_a = ["\n        query fetchLuke($id: String) {\n          people_one(id: $id) {\n            name\n          }\n        }\n      "], _a.raw = ["\n        query fetchLuke($id: String) {\n          people_one(id: $id) {\n            name\n          }\n        }\n      "], graphql_tag_1.default(_a));
            var variables = {
                id: '1',
            };
            var data1 = {
                people_one: {
                    name: 'Luke Skywalker',
                },
            };
            var data2 = {
                people_one: {
                    name: 'Luke Skywalker has a new name',
                },
            };
            var queryManager = src_1.mockQueryManager({
                request: { query: query, variables: variables },
                result: { data: data1 },
            }, {
                request: { query: query, variables: variables },
                result: { data: data2 },
            });
            var observable = queryManager.watchQuery({ query: query, variables: variables });
            observable.startPolling(50);
            return src_2.observableToPromise({ observable: observable }, function (result) { return chai_1.assert.deepEqual(result.data, data1); }, function (result) { return chai_1.assert.deepEqual(result.data, data2); });
            var _a;
        });
        it('exposes a way to stop a polling query', function () {
            var query = (_a = ["\n        query fetchLeia($id: String) {\n          people_one(id: $id) {\n            name\n          }\n        }\n      "], _a.raw = ["\n        query fetchLeia($id: String) {\n          people_one(id: $id) {\n            name\n          }\n        }\n      "], graphql_tag_1.default(_a));
            var variables = {
                id: '2',
            };
            var data1 = {
                people_one: {
                    name: 'Leia Skywalker',
                },
            };
            var data2 = {
                people_one: {
                    name: 'Leia Skywalker has a new name',
                },
            };
            var queryManager = src_1.mockQueryManager({
                request: { query: query, variables: variables },
                result: { data: data1 },
            }, {
                request: { query: query, variables: variables },
                result: { data: data2 },
            });
            var observable = queryManager.watchQuery({
                query: query,
                variables: variables,
                pollInterval: 50,
            });
            return src_2.observableToPromise({ observable: observable, wait: 60 }, function (result) {
                chai_1.assert.deepEqual(result.data, data1);
                observable.stopPolling();
            });
            var _a;
        });
        it('stopped polling queries still get updates', function () {
            var query = (_a = ["\n        query fetchLeia($id: String) {\n          people_one(id: $id) {\n            name\n          }\n        }\n      "], _a.raw = ["\n        query fetchLeia($id: String) {\n          people_one(id: $id) {\n            name\n          }\n        }\n      "], graphql_tag_1.default(_a));
            var variables = {
                id: '2',
            };
            var data1 = {
                people_one: {
                    name: 'Leia Skywalker',
                },
            };
            var data2 = {
                people_one: {
                    name: 'Leia Skywalker has a new name',
                },
            };
            var queryManager = src_1.mockQueryManager({
                request: { query: query, variables: variables },
                result: { data: data1 },
            }, {
                request: { query: query, variables: variables },
                result: { data: data2 },
            });
            var observable = queryManager.watchQuery({
                query: query,
                variables: variables,
                pollInterval: 50,
            });
            var timeout;
            return Promise.race([
                src_2.observableToPromise({ observable: observable }, function (result) {
                    chai_1.assert.deepEqual(result.data, data1);
                    queryManager.query({ query: query, variables: variables, forceFetch: true })
                        .then(function () { return timeout(new Error('Should have two results by now')); });
                }, function (result) { return chai_1.assert.deepEqual(result.data, data2); }),
                new Promise(function (resolve, reject) {
                    timeout = function (error) { return reject(error); };
                }),
            ]);
            var _a;
        });
    });
    it('warns if you forget the template literal tag', function () {
        var queryManager = src_1.mockQueryManager();
        chai_1.assert.throws(function () {
            queryManager.query({
                query: 'string',
            });
        }, /wrap the query string in a "gql" tag/);
        chai_1.assert.throws(function () {
            queryManager.mutate({
                mutation: 'string',
            });
        }, /wrap the query string in a "gql" tag/);
        chai_1.assert.throws(function () {
            queryManager.watchQuery({
                query: 'string',
            });
        }, /wrap the query string in a "gql" tag/);
    });
    it('should transform queries correctly when given a QueryTransformer', function (done) {
        var query = (_a = ["\n      query {\n        author {\n          firstName\n          lastName\n        }\n      }"], _a.raw = ["\n      query {\n        author {\n          firstName\n          lastName\n        }\n      }"], graphql_tag_1.default(_a));
        var transformedQuery = (_b = ["\n      query {\n        author {\n          firstName\n          lastName\n          __typename\n        }\n      }"], _b.raw = ["\n      query {\n        author {\n          firstName\n          lastName\n          __typename\n        }\n      }"], graphql_tag_1.default(_b));
        var unmodifiedQueryResult = {
            'author': {
                'firstName': 'John',
                'lastName': 'Smith',
            },
        };
        var transformedQueryResult = {
            'author': {
                'firstName': 'John',
                'lastName': 'Smith',
                '__typename': 'Author',
            },
        };
        createQueryManager({
            networkInterface: src_1.mockNetworkInterface({
                request: { query: query },
                result: { data: unmodifiedQueryResult },
            }, {
                request: { query: transformedQuery },
                result: { data: transformedQueryResult },
            }),
            addTypename: true,
        }).query({ query: query }).then(function (result) {
            chai_1.assert.deepEqual(result.data, transformedQueryResult);
            done();
        });
        var _a, _b;
    });
    it('should transform mutations correctly', function (done) {
        var mutation = (_a = ["\n      mutation {\n        createAuthor(firstName: \"John\", lastName: \"Smith\") {\n          firstName\n          lastName\n        }\n      }"], _a.raw = ["\n      mutation {\n        createAuthor(firstName: \"John\", lastName: \"Smith\") {\n          firstName\n          lastName\n        }\n      }"], graphql_tag_1.default(_a));
        var transformedMutation = (_b = ["\n      mutation {\n        createAuthor(firstName: \"John\", lastName: \"Smith\") {\n          firstName\n          lastName\n          __typename\n        }\n      }"], _b.raw = ["\n      mutation {\n        createAuthor(firstName: \"John\", lastName: \"Smith\") {\n          firstName\n          lastName\n          __typename\n        }\n      }"], graphql_tag_1.default(_b));
        var unmodifiedMutationResult = {
            'createAuthor': {
                'firstName': 'It works!',
                'lastName': 'It works!',
            },
        };
        var transformedMutationResult = {
            'createAuthor': {
                'firstName': 'It works!',
                'lastName': 'It works!',
                '__typename': 'Author',
            },
        };
        createQueryManager({
            networkInterface: src_1.mockNetworkInterface({
                request: { query: mutation },
                result: { data: unmodifiedMutationResult },
            }, {
                request: { query: transformedMutation },
                result: { data: transformedMutationResult },
            }),
            addTypename: true,
        }).mutate({ mutation: mutation }).then(function (result) {
            chai_1.assert.deepEqual(result.data, transformedMutationResult);
            done();
        });
        var _a, _b;
    });
    describe('store resets', function () {
        it('should change the store state to an empty state', function () {
            var queryManager = createQueryManager({});
            queryManager.resetStore();
            var currentState = queryManager.getApolloState();
            var expectedState = {
                data: {},
                mutations: {},
                queries: {},
                optimistic: [],
                reducerError: null,
            };
            chai_1.assert.deepEqual(currentState, expectedState);
        });
        it('should only refetch once when we store reset', function () {
            var queryManager = null;
            var query = (_a = ["\n        query {\n          author {\n            firstName\n            lastName\n          }\n        }"], _a.raw = ["\n        query {\n          author {\n            firstName\n            lastName\n          }\n        }"], graphql_tag_1.default(_a));
            var data = {
                author: {
                    firstName: 'John',
                    lastName: 'Smith',
                },
            };
            var timesFired = 0;
            var networkInterface = {
                query: function (request) {
                    if (timesFired === 0) {
                        timesFired += 1;
                        queryManager.resetStore();
                    }
                    else {
                        timesFired += 1;
                    }
                    return Promise.resolve({ data: data });
                },
            };
            queryManager = createQueryManager({ networkInterface: networkInterface });
            var observable = queryManager.watchQuery({ query: query });
            return src_2.observableToPromise({ observable: observable, wait: 0 }, function (result) { return chai_1.assert.deepEqual(result.data, data); }).then(function () {
                chai_1.assert.equal(timesFired, 2);
            });
            var _a;
        });
        it('should not error on queries that are already in the store', function () {
            var queryManager = null;
            var query = (_a = ["\n        query {\n          author {\n            firstName\n            lastName\n          }\n        }"], _a.raw = ["\n        query {\n          author {\n            firstName\n            lastName\n          }\n        }"], graphql_tag_1.default(_a));
            var data = {
                author: {
                    firstName: 'John',
                    lastName: 'Smith',
                },
            };
            var timesFired = 0;
            var networkInterface = {
                query: function (request) {
                    if (timesFired === 0) {
                        timesFired += 1;
                        setTimeout(queryManager.resetStore.bind(queryManager), 10);
                    }
                    else {
                        timesFired += 1;
                    }
                    return Promise.resolve({ data: data });
                },
            };
            queryManager = createQueryManager({ networkInterface: networkInterface });
            var observable = queryManager.watchQuery({ query: query });
            return src_2.observableToPromise({ observable: observable, wait: 20 }, function (result) { return chai_1.assert.deepEqual(result.data, data); }).then(function () {
                chai_1.assert.equal(timesFired, 2);
            });
            var _a;
        });
        it('should throw an error on an inflight fetch query if the store is reset', function (done) {
            var query = (_a = ["\n        query {\n          author {\n            firstName\n            lastName\n          }\n        }"], _a.raw = ["\n        query {\n          author {\n            firstName\n            lastName\n          }\n        }"], graphql_tag_1.default(_a));
            var data = {
                author: {
                    firstName: 'John',
                    lastName: 'Smith',
                },
            };
            var queryManager = src_1.mockQueryManager({
                request: { query: query },
                result: { data: data },
                delay: 10000,
            });
            queryManager.fetchQuery('made up id', { query: query }).then(function (result) {
                done(new Error('Returned a result.'));
            }).catch(function (error) {
                chai_1.assert.include(error.message, 'Store reset');
                done();
            });
            queryManager.resetStore();
            var _a;
        });
        it('should call refetch on a mocked Observable if the store is reset', function (done) {
            var query = (_a = ["\n        query {\n          author {\n            firstName\n            lastName\n          }\n        }"], _a.raw = ["\n        query {\n          author {\n            firstName\n            lastName\n          }\n        }"], graphql_tag_1.default(_a));
            var queryManager = src_1.mockQueryManager();
            var mockObservableQuery = {
                refetch: function (variables) {
                    done();
                    return null;
                },
                options: {
                    query: query,
                },
                scheduler: queryManager.scheduler,
            };
            var queryId = 'super-fake-id';
            queryManager.addObservableQuery(queryId, mockObservableQuery);
            queryManager.resetStore();
            var _a;
        });
        it('should not call refetch on a noFetch Observable if the store is reset', function (done) {
            var query = (_a = ["\n        query {\n          author {\n            firstName\n            lastName\n          }\n        }"], _a.raw = ["\n        query {\n          author {\n            firstName\n            lastName\n          }\n        }"], graphql_tag_1.default(_a));
            var queryManager = createQueryManager({});
            var options = lodash_1.assign({});
            options.noFetch = true;
            options.query = query;
            var refetchCount = 0;
            var mockObservableQuery = {
                refetch: function (variables) {
                    refetchCount++;
                    done();
                    return null;
                },
                options: options,
                queryManager: queryManager,
            };
            var queryId = 'super-fake-id';
            queryManager.addObservableQuery(queryId, mockObservableQuery);
            queryManager.resetStore();
            setTimeout(function () {
                chai_1.assert.equal(refetchCount, 0);
                done();
            }, 400);
            var _a;
        });
        it('should throw an error on an inflight query() if the store is reset', function (done) {
            var queryManager = null;
            var query = (_a = ["\n        query {\n          author {\n            firstName\n            lastName\n          }\n        }"], _a.raw = ["\n        query {\n          author {\n            firstName\n            lastName\n          }\n        }"], graphql_tag_1.default(_a));
            var data = {
                author: {
                    firstName: 'John',
                    lastName: 'Smith',
                },
            };
            var networkInterface = {
                query: function (request) {
                    queryManager.resetStore();
                    return Promise.resolve({ data: data });
                },
            };
            queryManager = createQueryManager({ networkInterface: networkInterface });
            queryManager.query({ query: query }).then(function (result) {
                done(new Error('query() gave results on a store reset'));
            }).catch(function (error) {
                done();
            });
            var _a;
        });
    });
    it('should reject a query promise given a network error', function (done) {
        var query = (_a = ["\n      query {\n        author {\n          firstName\n          lastName\n        }\n      }"], _a.raw = ["\n      query {\n        author {\n          firstName\n          lastName\n        }\n      }"], graphql_tag_1.default(_a));
        var networkError = new Error('Network error');
        src_1.mockQueryManager({
            request: { query: query },
            error: networkError,
        }).query({ query: query }).then(function (result) {
            done(new Error('Returned result on an errored fetchQuery'));
        }).catch(function (error) {
            var apolloError = error;
            chai_1.assert(apolloError.message);
            chai_1.assert.equal(apolloError.networkError, networkError);
            chai_1.assert(!apolloError.graphQLErrors);
            done();
        });
        var _a;
    });
    it('should error when we attempt to give an id beginning with $', function (done) {
        var query = (_a = ["\n      query {\n        author {\n          firstName\n          lastName\n          id\n          __typename\n        }\n      }"], _a.raw = ["\n      query {\n        author {\n          firstName\n          lastName\n          id\n          __typename\n        }\n      }"], graphql_tag_1.default(_a));
        var data = {
            author: {
                firstName: 'John',
                lastName: 'Smith',
                id: '129',
                __typename: 'Author',
            },
        };
        var reducerConfig = { dataIdFromObject: function (x) { return '$' + dataIdFromObject(x); } };
        var store = store_2.createApolloStore({ config: reducerConfig, reportCrashes: false });
        createQueryManager({
            networkInterface: src_1.mockNetworkInterface({
                request: { query: query },
                result: { data: data },
            }),
            store: store,
        }).query({ query: query }).then(function (result) {
            done(new Error('Returned a result when it should not have.'));
        }).catch(function (error) {
            done();
        });
        var _a;
    });
    it('should reject a query promise given a GraphQL error', function () {
        var query = (_a = ["\n      query {\n        author {\n          firstName\n          lastName\n        }\n      }"], _a.raw = ["\n      query {\n        author {\n          firstName\n          lastName\n        }\n      }"], graphql_tag_1.default(_a));
        var graphQLErrors = [new Error('GraphQL error')];
        return src_1.mockQueryManager({
            request: { query: query },
            result: { errors: graphQLErrors },
        }).query({ query: query }).then(function (result) {
            throw new Error('Returned result on an errored fetchQuery');
        }, function (error) {
            var apolloError = error;
            chai_1.assert(apolloError.message);
            chai_1.assert.equal(apolloError.graphQLErrors, graphQLErrors);
            chai_1.assert(!apolloError.networkError);
        });
        var _a;
    });
    it('should not empty the store when a non-polling query fails due to a network error', function (done) {
        var query = (_a = ["\n      query {\n        author {\n          firstName\n          lastName\n        }\n      }"], _a.raw = ["\n      query {\n        author {\n          firstName\n          lastName\n        }\n      }"], graphql_tag_1.default(_a));
        var data = {
            author: {
                firstName: 'Dhaivat',
                lastName: 'Pandya',
            },
        };
        var queryManager = src_1.mockQueryManager({
            request: { query: query },
            result: { data: data },
        }, {
            request: { query: query },
            error: new Error('Network error ocurred'),
        });
        queryManager.query({ query: query }).then(function (result) {
            chai_1.assert.deepEqual(result.data, data);
            queryManager.query({ query: query, forceFetch: true }).then(function () {
                done(new Error('Returned a result when it was not supposed to.'));
            }).catch(function (error) {
                chai_1.assert.deepEqual(queryManager.store.getState().apollo.data['$ROOT_QUERY.author'], data['author']);
                done();
            });
        }).catch(function (error) {
            done(new Error('Threw an error on the first query.'));
        });
        var _a;
    });
    it('should be able to unsubscribe from a polling query subscription', function () {
        var query = (_a = ["\n      query {\n        author {\n          firstName\n          lastName\n        }\n      }"], _a.raw = ["\n      query {\n        author {\n          firstName\n          lastName\n        }\n      }"], graphql_tag_1.default(_a));
        var data = {
            author: {
                firstName: 'John',
                lastName: 'Smith',
            },
        };
        var observable = src_1.mockQueryManager({
            request: { query: query },
            result: { data: data },
        }).watchQuery({ query: query, pollInterval: 20 });
        var _b = src_2.observableToPromiseAndSubscription({
            observable: observable,
            wait: 60,
        }, function (result) {
            chai_1.assert.deepEqual(result.data, data);
            subscription.unsubscribe();
        }), promise = _b.promise, subscription = _b.subscription;
        return promise;
        var _a;
    });
    it('should not empty the store when a polling query fails due to a network error', function () {
        var query = (_a = ["\n      query {\n        author {\n          firstName\n          lastName\n        }\n      }"], _a.raw = ["\n      query {\n        author {\n          firstName\n          lastName\n        }\n      }"], graphql_tag_1.default(_a));
        var data = {
            author: {
                firstName: 'John',
                lastName: 'Smith',
            },
        };
        var queryManager = src_1.mockQueryManager({
            request: { query: query },
            result: { data: data },
        }, {
            request: { query: query },
            error: new Error('Network error occurred.'),
        });
        var observable = queryManager.watchQuery({ query: query, pollInterval: 20 });
        return src_2.observableToPromise({
            observable: observable,
            errorCallbacks: [
                function () {
                    chai_1.assert.deepEqual(queryManager.store.getState().apollo.data['$ROOT_QUERY.author'], data.author);
                },
            ],
        }, function (result) {
            chai_1.assert.deepEqual(result.data, data);
            chai_1.assert.deepEqual(queryManager.store.getState().apollo.data['$ROOT_QUERY.author'], data.author);
        });
        var _a;
    });
    it('should not fire next on an observer if there is no change in the result', function () {
        var query = (_a = ["\n      query {\n        author {\n          firstName\n          lastName\n        }\n      }"], _a.raw = ["\n      query {\n        author {\n          firstName\n          lastName\n        }\n      }"], graphql_tag_1.default(_a));
        var data = {
            author: {
                firstName: 'John',
                lastName: 'Smith',
            },
        };
        var queryManager = src_1.mockQueryManager({
            request: { query: query },
            result: { data: data },
        }, {
            request: { query: query },
            result: { data: data },
        });
        var observable = queryManager.watchQuery({ query: query });
        return Promise.all([
            src_2.observableToPromise({ observable: observable, wait: 100 }, function (result) {
                chai_1.assert.deepEqual(result.data, data);
            }),
            queryManager.query({ query: query }).then(function (result) {
                chai_1.assert.deepEqual(result.data, data);
            }),
        ]);
        var _a;
    });
    it('should error when we orphan a real-id node in the store with a real-id node', function () {
        var query1 = (_a = ["\n      query {\n        author {\n          name {\n            firstName\n            lastName\n          }\n          age\n          id\n          __typename\n        }\n      }\n    "], _a.raw = ["\n      query {\n        author {\n          name {\n            firstName\n            lastName\n          }\n          age\n          id\n          __typename\n        }\n      }\n    "], graphql_tag_1.default(_a));
        var query2 = (_b = ["\n      query {\n        author {\n          name {\n            firstName\n          }\n          id\n          __typename\n        }\n      }"], _b.raw = ["\n      query {\n        author {\n          name {\n            firstName\n          }\n          id\n          __typename\n        }\n      }"], graphql_tag_1.default(_b));
        var data1 = {
            author: {
                name: {
                    firstName: 'John',
                    lastName: 'Smith',
                },
                age: 18,
                id: '187',
                __typename: 'Author',
            },
        };
        var data2 = {
            author: {
                name: {
                    firstName: 'John',
                },
                id: '197',
                __typename: 'Author',
            },
        };
        var reducerConfig = { dataIdFromObject: dataIdFromObject };
        var store = store_2.createApolloStore({ config: reducerConfig, reportCrashes: false });
        var queryManager = createQueryManager({
            networkInterface: src_1.mockNetworkInterface({
                request: { query: query1 },
                result: { data: data1 },
            }, {
                request: { query: query2 },
                result: { data: data2 },
            }),
            store: store,
        });
        var observable1 = queryManager.watchQuery({ query: query1 });
        var observable2 = queryManager.watchQuery({ query: query2 });
        return Promise.all([
            src_2.observableToPromise({
                observable: observable1,
                errorCallbacks: [
                    function (error) { return chai_1.assert.include(error.networkError.message, 'find field'); },
                ],
                wait: 60,
            }, function (result) { return chai_1.assert.deepEqual(result.data, data1); }),
            src_2.observableToPromise({
                observable: observable2,
                wait: 60,
            }, function (result) { return chai_1.assert.deepEqual(result.data, data2); }),
        ]);
        var _a, _b;
    });
    it('should error if we replace a real id node in the store with a generated id node', function () {
        var queryWithId = (_a = ["\n      query {\n        author {\n          firstName\n          lastName\n          __typename\n          id\n        }\n      }"], _a.raw = ["\n      query {\n        author {\n          firstName\n          lastName\n          __typename\n          id\n        }\n      }"], graphql_tag_1.default(_a));
        var dataWithId = {
            author: {
                firstName: 'John',
                lastName: 'Smith',
                id: '129',
                __typename: 'Author',
            },
        };
        var queryWithoutId = (_b = ["\n      query {\n        author {\n          address\n        }\n      }"], _b.raw = ["\n      query {\n        author {\n          address\n        }\n      }"], graphql_tag_1.default(_b));
        var dataWithoutId = {
            author: {
                address: 'fake address',
            },
        };
        var reducerConfig = { dataIdFromObject: dataIdFromObject };
        var store = store_2.createApolloStore({ config: reducerConfig, reportCrashes: false });
        var queryManager = createQueryManager({
            networkInterface: src_1.mockNetworkInterface({
                request: { query: queryWithId },
                result: { data: dataWithId },
            }, {
                request: { query: queryWithoutId },
                result: { data: dataWithoutId },
            }),
            store: store,
        });
        var observableWithId = queryManager.watchQuery({ query: queryWithId });
        var observableWithoutId = queryManager.watchQuery({ query: queryWithoutId });
        return Promise.all([
            src_2.observableToPromise({ observable: observableWithId, wait: 60 }, function (result) { return chai_1.assert.deepEqual(result.data, dataWithId); }),
            src_2.observableToPromise({
                observable: observableWithoutId,
                errorCallbacks: [
                    function (error) { return chai_1.assert.include(error.message, 'Store error'); },
                    function (error) { return chai_1.assert.include(error.message, 'Store error'); },
                ],
                wait: 60,
            }),
        ]);
        var _a, _b;
    });
    it('should not error when merging a generated id store node  with a real id node', function () {
        var queryWithoutId = (_a = ["\n      query {\n        author {\n          name {\n            firstName\n            lastName\n          }\n          age\n          __typename\n        }\n      }"], _a.raw = ["\n      query {\n        author {\n          name {\n            firstName\n            lastName\n          }\n          age\n          __typename\n        }\n      }"], graphql_tag_1.default(_a));
        var queryWithId = (_b = ["\n      query {\n        author {\n          name {\n            firstName\n          }\n          id\n          __typename\n        }\n      }"], _b.raw = ["\n      query {\n        author {\n          name {\n            firstName\n          }\n          id\n          __typename\n        }\n      }"], graphql_tag_1.default(_b));
        var dataWithoutId = {
            author: {
                name: {
                    firstName: 'John',
                    lastName: 'Smith',
                },
                age: '124',
                __typename: 'Author',
            },
        };
        var dataWithId = {
            author: {
                name: {
                    firstName: 'Jane',
                },
                id: '129',
                __typename: 'Author',
            },
        };
        var mergedDataWithoutId = {
            author: {
                name: {
                    firstName: 'Jane',
                    lastName: 'Smith',
                },
                age: '124',
                __typename: 'Author',
            },
        };
        var store = store_2.createApolloStore({ config: { dataIdFromObject: dataIdFromObject } });
        var queryManager = createQueryManager({
            networkInterface: src_1.mockNetworkInterface({
                request: { query: queryWithoutId },
                result: { data: dataWithoutId },
            }, {
                request: { query: queryWithId },
                result: { data: dataWithId },
            }),
            store: store,
        });
        var observableWithId = queryManager.watchQuery({ query: queryWithId });
        var observableWithoutId = queryManager.watchQuery({ query: queryWithoutId });
        return Promise.all([
            src_2.observableToPromise({ observable: observableWithoutId, wait: 120 }, function (result) { return chai_1.assert.deepEqual(result.data, dataWithoutId); }, function (result) { return chai_1.assert.deepEqual(result.data, mergedDataWithoutId); }),
            src_2.observableToPromise({ observable: observableWithId, wait: 120 }, function (result) { return chai_1.assert.deepEqual(result.data, dataWithId); }),
        ]);
        var _a, _b;
    });
    describe('loading state', function () {
        it('should be passed as false if we are not watching a query', function () {
            var query = (_a = ["\n        query {\n          fortuneCookie\n        }"], _a.raw = ["\n        query {\n          fortuneCookie\n        }"], graphql_tag_1.default(_a));
            var data = {
                fortuneCookie: 'Buy it',
            };
            return src_1.mockQueryManager({
                request: { query: query },
                result: { data: data },
            }).query({ query: query }).then(function (result) {
                chai_1.assert(!result.loading);
                chai_1.assert.deepEqual(result.data, data);
            });
            var _a;
        });
        it('should be passed to the observer as true if we are returning partial data', function () {
            var fortuneCookie = 'You must stick to your goal but rethink your approach';
            var primeQuery = (_a = ["\n        query {\n          fortuneCookie\n        }"], _a.raw = ["\n        query {\n          fortuneCookie\n        }"], graphql_tag_1.default(_a));
            var primeData = { fortuneCookie: fortuneCookie };
            var author = { name: 'John' };
            var query = (_b = ["\n        query {\n          fortuneCookie\n          author {\n            name\n          }\n        }"], _b.raw = ["\n        query {\n          fortuneCookie\n          author {\n            name\n          }\n        }"], graphql_tag_1.default(_b));
            var fullData = { fortuneCookie: fortuneCookie, author: author };
            var queryManager = src_1.mockQueryManager({
                request: { query: query },
                result: { data: fullData },
                delay: 5,
            }, {
                request: { query: primeQuery },
                result: { data: primeData },
            });
            return queryManager.query({ query: primeQuery }).then(function (primeResult) {
                var observable = queryManager.watchQuery({ query: query, returnPartialData: true });
                return src_2.observableToPromise({ observable: observable }, function (result) {
                    chai_1.assert(result.loading);
                    chai_1.assert.deepEqual(result.data, primeData);
                }, function (result) {
                    chai_1.assert(!result.loading);
                    chai_1.assert.deepEqual(result.data, fullData);
                });
            });
            var _a, _b;
        });
        it('should be passed to the observer as false if we are returning all the data', function (done) {
            assertWithObserver({
                done: done,
                query: (_a = ["\n          query {\n            author {\n              firstName\n              lastName\n            }\n          }"], _a.raw = ["\n          query {\n            author {\n              firstName\n              lastName\n            }\n          }"], graphql_tag_1.default(_a)),
                result: {
                    data: {
                        author: {
                            firstName: 'John',
                            lastName: 'Smith',
                        },
                    },
                },
                observer: {
                    next: function (result) {
                        chai_1.assert(!result.loading);
                        done();
                    },
                },
            });
            var _a;
        });
    });
    describe('refetchQueries', function () {
        var oldWarn = console.warn;
        var warned;
        var timesWarned = 0;
        beforeEach(function (done) {
            warned = null;
            timesWarned = 0;
            console.warn = function () {
                var args = [];
                for (var _i = 0; _i < arguments.length; _i++) {
                    args[_i - 0] = arguments[_i];
                }
                warned = args;
                timesWarned++;
            };
            done();
        });
        it('should refetch the right query when a result is successfully returned', function () {
            var mutation = (_a = ["\n        mutation changeAuthorName {\n          changeAuthorName(newName: \"Jack Smith\") {\n            firstName\n            lastName\n          }\n        }"], _a.raw = ["\n        mutation changeAuthorName {\n          changeAuthorName(newName: \"Jack Smith\") {\n            firstName\n            lastName\n          }\n        }"], graphql_tag_1.default(_a));
            var mutationData = {
                changeAuthorName: {
                    firstName: 'Jack',
                    lastName: 'Smith',
                },
            };
            var query = (_b = ["\n        query getAuthors {\n          author {\n            firstName\n            lastName\n          }\n        }"], _b.raw = ["\n        query getAuthors {\n          author {\n            firstName\n            lastName\n          }\n        }"], graphql_tag_1.default(_b));
            var data = {
                author: {
                    firstName: 'John',
                    lastName: 'Smith',
                },
            };
            var secondReqData = {
                author: {
                    firstName: 'Jane',
                    lastName: 'Johnson',
                },
            };
            var queryManager = src_1.mockQueryManager({
                request: { query: query },
                result: { data: data },
            }, {
                request: { query: query },
                result: { data: secondReqData },
            }, {
                request: { query: mutation },
                result: { data: mutationData },
            });
            var observable = queryManager.watchQuery({ query: query });
            return src_2.observableToPromise({ observable: observable }, function (result) {
                chai_1.assert.deepEqual(result.data, data);
                queryManager.mutate({ mutation: mutation, refetchQueries: ['getAuthors'] });
            }, function (result) { return chai_1.assert.deepEqual(result.data, secondReqData); });
            var _a, _b;
        });
        it('should warn but continue when an unknown query name is asked to refetch', function () {
            var mutation = (_a = ["\n        mutation changeAuthorName {\n          changeAuthorName(newName: \"Jack Smith\") {\n            firstName\n            lastName\n          }\n        }"], _a.raw = ["\n        mutation changeAuthorName {\n          changeAuthorName(newName: \"Jack Smith\") {\n            firstName\n            lastName\n          }\n        }"], graphql_tag_1.default(_a));
            var mutationData = {
                changeAuthorName: {
                    firstName: 'Jack',
                    lastName: 'Smith',
                },
            };
            var query = (_b = ["\n        query getAuthors {\n          author {\n            firstName\n            lastName\n          }\n        }"], _b.raw = ["\n        query getAuthors {\n          author {\n            firstName\n            lastName\n          }\n        }"], graphql_tag_1.default(_b));
            var data = {
                author: {
                    firstName: 'John',
                    lastName: 'Smith',
                },
            };
            var secondReqData = {
                author: {
                    firstName: 'Jane',
                    lastName: 'Johnson',
                },
            };
            var queryManager = src_1.mockQueryManager({
                request: { query: query },
                result: { data: data },
            }, {
                request: { query: query },
                result: { data: secondReqData },
            }, {
                request: { query: mutation },
                result: { data: mutationData },
            });
            var observable = queryManager.watchQuery({ query: query });
            return src_2.observableToPromise({ observable: observable }, function (result) {
                chai_1.assert.deepEqual(result.data, data);
                queryManager.mutate({ mutation: mutation, refetchQueries: ['fakeQuery', 'getAuthors'] });
            }, function (result) {
                chai_1.assert.deepEqual(result.data, secondReqData);
                chai_1.assert.include(warned[0], 'Warning: unknown query with name fakeQuery');
                chai_1.assert.equal(timesWarned, 1);
            });
            var _a, _b;
        });
        it('should ignore without warning a query name that is asked to refetch with no active subscriptions', function () {
            var mutation = (_a = ["\n        mutation changeAuthorName {\n          changeAuthorName(newName: \"Jack Smith\") {\n            firstName\n            lastName\n          }\n        }"], _a.raw = ["\n        mutation changeAuthorName {\n          changeAuthorName(newName: \"Jack Smith\") {\n            firstName\n            lastName\n          }\n        }"], graphql_tag_1.default(_a));
            var mutationData = {
                changeAuthorName: {
                    firstName: 'Jack',
                    lastName: 'Smith',
                },
            };
            var query = (_b = ["\n        query getAuthors {\n          author {\n            firstName\n            lastName\n          }\n        }"], _b.raw = ["\n        query getAuthors {\n          author {\n            firstName\n            lastName\n          }\n        }"], graphql_tag_1.default(_b));
            var data = {
                author: {
                    firstName: 'John',
                    lastName: 'Smith',
                },
            };
            var secondReqData = {
                author: {
                    firstName: 'Jane',
                    lastName: 'Johnson',
                },
            };
            var queryManager = src_1.mockQueryManager({
                request: { query: query },
                result: { data: data },
            }, {
                request: { query: query },
                result: { data: secondReqData },
            }, {
                request: { query: mutation },
                result: { data: mutationData },
            });
            var observable = queryManager.watchQuery({ query: query });
            return src_2.observableToPromise({ observable: observable }, function (result) {
                chai_1.assert.deepEqual(result.data, data);
            }).then(function () {
                return queryManager.mutate({ mutation: mutation, refetchQueries: ['getAuthors'] });
            })
                .then(function () { return chai_1.assert.equal(timesWarned, 0); });
            var _a, _b;
        });
        afterEach(function (done) {
            console.warn = oldWarn;
            done();
        });
    });
    describe('result transformation', function () {
        var client;
        var response;
        var transformCount;
        beforeEach(function () {
            transformCount = 0;
            var networkInterface = {
                query: function (request) {
                    return Promise.resolve(response);
                },
            };
            client = new ApolloClient_1.default({
                networkInterface: networkInterface,
                resultTransformer: function (result) {
                    transformCount++;
                    return {
                        data: lodash_1.assign({}, result.data, { transformCount: transformCount }),
                        loading: false,
                        networkStatus: store_1.NetworkStatus.ready,
                    };
                },
            });
        });
        it('transforms query() results', function () {
            response = { data: { foo: 123 } };
            return client.query({ query: (_a = ["{ foo }"], _a.raw = ["{ foo }"], graphql_tag_1.default(_a)) })
                .then(function (result) {
                chai_1.assert.deepEqual(result.data, { foo: 123, transformCount: 1 });
            });
            var _a;
        });
        it('transforms watchQuery() results', function () {
            response = { data: { foo: 123 } };
            var observable = client.watchQuery({ query: (_a = ["{ foo }"], _a.raw = ["{ foo }"], graphql_tag_1.default(_a)) });
            return src_2.observableToPromise({ observable: observable }, function (result) {
                chai_1.assert.deepEqual(result.data, { foo: 123, transformCount: 1 });
                response = { data: { foo: 456 } };
                observable.refetch();
            }, function (result) { return chai_1.assert.deepEqual(result.data, { foo: 456, transformCount: 2 }); });
            var _a;
        });
        it('does not transform identical watchQuery() results', function () {
            response = { data: { foo: 123 } };
            var observable = client.watchQuery({ query: (_a = ["{ foo }"], _a.raw = ["{ foo }"], graphql_tag_1.default(_a)) });
            var succeed;
            return Promise.race([
                src_2.observableToPromise({ observable: observable, shouldResolve: false }, function (result) {
                    chai_1.assert.deepEqual(result.data, { foo: 123, transformCount: 1 });
                    observable.refetch().then(function () { return succeed(); });
                }),
                new Promise(function (resolve) { return succeed = resolve; }),
            ]);
            var _a;
        });
        it('transforms mutate() results', function () {
            response = { data: { foo: 123 } };
            return client.mutate({ mutation: (_a = ["mutation makeChanges { foo }"], _a.raw = ["mutation makeChanges { foo }"], graphql_tag_1.default(_a)) })
                .then(function (result) {
                chai_1.assert.deepEqual(result.data, { foo: 123, transformCount: 1 });
            });
            var _a;
        });
    });
    describe('result transformation with custom equality', function () {
        var Model = (function () {
            function Model() {
            }
            return Model;
        }());
        var client;
        var response;
        beforeEach(function () {
            var networkInterface = {
                query: function (request) {
                    return Promise.resolve(response);
                },
            };
            client = new ApolloClient_1.default({
                networkInterface: networkInterface,
                resultTransformer: function (result) {
                    result.data.__proto__ = Model.prototype;
                    return result;
                },
                resultComparator: function (result1, result2) {
                    var foo1 = result1 && result1.data && result1.data.foo;
                    var foo2 = result2 && result2.data && result2.data.foo;
                    return foo1 === foo2;
                },
            });
        });
        it('does not transform identical watchQuery() results, according to the comparator', function () {
            response = { data: { foo: 123 } };
            var observable = client.watchQuery({ query: (_a = ["{ foo }"], _a.raw = ["{ foo }"], graphql_tag_1.default(_a)) });
            var succeed;
            return Promise.race([
                src_2.observableToPromise({ observable: observable, shouldResolve: false }, function (result) {
                    chai_1.assert.instanceOf(result.data, Model);
                    response = { data: { foo: 123 } };
                    observable.refetch().then(function () { return succeed(); });
                }),
                new Promise(function (resolve) { return succeed = resolve; }),
            ]);
            var _a;
        });
    });
    it('exposes errors on a refetch as a rejection', function (done) {
        var request = {
            query: (_a = ["\n      {\n        people_one(id: 1) {\n          name\n        }\n      }"], _a.raw = ["\n      {\n        people_one(id: 1) {\n          name\n        }\n      }"], graphql_tag_1.default(_a)),
        };
        var firstResult = {
            data: {
                people_one: {
                    name: 'Luke Skywalker',
                },
            },
        };
        var secondResult = {
            errors: [
                {
                    name: 'PeopleError',
                    message: 'This is not the person you are looking for.',
                },
            ],
        };
        var queryManager = mockRefetch({ request: request, firstResult: firstResult, secondResult: secondResult });
        var handle = queryManager.watchQuery(request);
        handle.subscribe({
            error: function () { },
        });
        handle.refetch().catch(function (error) {
            chai_1.assert.deepEqual(error.graphQLErrors, [
                {
                    name: 'PeopleError',
                    message: 'This is not the person you are looking for.',
                },
            ]);
            done();
        });
        var _a;
    });
});
//# sourceMappingURL=QueryManager.js.map