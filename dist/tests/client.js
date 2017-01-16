"use strict";
var lodash_1 = require('lodash');
var chai_1 = require('chai');
var sinon_1 = require('sinon');
var redux_1 = require('redux');
var graphql_tag_1 = require('graphql-tag');
var printer_1 = require('graphql-tag/printer');
var store_1 = require('apollo-client/queries/store');
var fragments_1 = require('apollo-client/fragments');
var batchedNetworkInterface_1 = require('apollo-client/transport/batchedNetworkInterface');
var getFromAST_1 = require('apollo-client/queries/getFromAST');
var apollo_client_1 = require('apollo-client');
var networkInterface_1 = require('apollo-client/transport/networkInterface');
var redux_todomvc_1 = require('./fixtures/redux-todomvc');
var src_1 = require('../src');
var src_2 = require('../src');
var src_3 = require('../src');
apollo_client_1.disableFragmentWarnings();
describe('client', function () {
    it('does not require any arguments and creates store lazily', function () {
        var client = new apollo_client_1.default();
        chai_1.assert.isUndefined(client.store);
        client.initStore();
        chai_1.assert.isDefined(client.store);
        chai_1.assert.isDefined(client.store.getState().apollo);
    });
    it('can be loaded via require', function () {
        var ApolloClientRequire = require('apollo-client').default;
        var client = new ApolloClientRequire();
        chai_1.assert.isUndefined(client.store);
        client.initStore();
        chai_1.assert.isDefined(client.store);
        chai_1.assert.isDefined(client.store.getState().apollo);
    });
    it('can allow passing in a network interface', function () {
        var networkInterface = networkInterface_1.createNetworkInterface({ uri: 'swapi' });
        var client = new apollo_client_1.default({
            networkInterface: networkInterface,
        });
        chai_1.assert.equal(client.networkInterface._uri, networkInterface._uri);
    });
    it('throws an error if you pass in a store without apolloReducer', function () {
        try {
            var client = new apollo_client_1.default();
            redux_1.createStore(redux_1.combineReducers({
                todos: redux_todomvc_1.rootReducer,
            }), redux_1.applyMiddleware(client.middleware()));
            chai_1.assert.fail();
        }
        catch (error) {
            chai_1.assert.equal(error.message, 'Existing store does not use apolloReducer. Please make sure the store ' +
                'is properly configured and "reduxRootSelector" is correctly specified.');
        }
    });
    it('has a top level key by default', function () {
        var client = new apollo_client_1.default();
        client.initStore();
        chai_1.assert.deepEqual(client.store.getState(), {
            apollo: {
                queries: {},
                mutations: {},
                data: {},
                optimistic: [],
                reducerError: null,
            },
        });
    });
    it('sets reduxRootKey by default (backcompat)', function () {
        var client = new apollo_client_1.default();
        client.initStore();
        chai_1.assert.equal(client.reduxRootKey, 'apollo');
    });
    it('sets reduxRootKey if you use ApolloClient as middleware', function () {
        var client = new apollo_client_1.default();
        redux_1.createStore(redux_1.combineReducers({
            apollo: client.reducer(),
        }), redux_1.applyMiddleware(client.middleware()));
        chai_1.assert.equal(client.reduxRootKey, 'apollo');
    });
    it('can allow passing in a top level key (backcompat)', function () {
        src_3.withWarning(function () {
            var reduxRootKey = 'testApollo';
            var client = new apollo_client_1.default({
                reduxRootKey: reduxRootKey,
            });
            redux_1.createStore(redux_1.combineReducers({
                testApollo: client.reducer(),
            }), redux_1.applyMiddleware(client.middleware()));
            chai_1.assert.equal(client.reduxRootKey, 'testApollo');
        }, /reduxRootKey/);
    });
    it('should allow passing in a selector function for apollo state', function () {
        var reduxRootSelector = function (state) { return state.testApollo; };
        var client = new apollo_client_1.default({
            reduxRootSelector: reduxRootSelector,
        });
        redux_1.createStore(redux_1.combineReducers({
            testApollo: client.reducer(),
        }), redux_1.applyMiddleware(client.middleware()));
    });
    it('should allow passing reduxRootSelector as a string', function () {
        var reduxRootSelector = 'testApollo';
        var client = new apollo_client_1.default({
            reduxRootSelector: reduxRootSelector,
        });
        redux_1.createStore(redux_1.combineReducers({
            testApollo: client.reducer(),
        }), redux_1.applyMiddleware(client.middleware()));
        chai_1.assert.equal(client.reduxRootKey, 'testApollo');
    });
    it('should throw an error if both "reduxRootKey" and "reduxRootSelector" are passed', function () {
        var reduxRootSelector = function (state) { return state.testApollo; };
        try {
            new apollo_client_1.default({
                reduxRootKey: 'apollo',
                reduxRootSelector: reduxRootSelector,
            });
            chai_1.assert.fail();
        }
        catch (error) {
            chai_1.assert.equal(error.message, 'Both "reduxRootKey" and "reduxRootSelector" are configured, but only one of two is allowed.');
        }
    });
    it('should throw an error if "reduxRootKey" is provided and the client tries to create the store', function () {
        var client = src_3.withWarning(function () {
            return new apollo_client_1.default({
                reduxRootKey: 'test',
            });
        }, /reduxRootKey/);
        try {
            client.initStore();
            chai_1.assert.fail();
        }
        catch (error) {
            chai_1.assert.equal(error.message, 'Cannot initialize the store because "reduxRootSelector" or "reduxRootKey" is provided. ' +
                'They should only be used when the store is created outside of the client. ' +
                'This may lead to unexpected results when querying the store internally. ' +
                "Please remove that option from ApolloClient constructor.");
        }
    });
    it('should throw an error if "reduxRootSelector" is provided and the client tries to create the store', function () {
        var reduxRootSelector = function (state) { return state.testApollo; };
        var client = new apollo_client_1.default({
            reduxRootSelector: reduxRootSelector,
        });
        try {
            client.initStore();
            chai_1.assert.fail();
        }
        catch (error) {
            chai_1.assert.equal(error.message, 'Cannot initialize the store because "reduxRootSelector" or "reduxRootKey" is provided. ' +
                'They should only be used when the store is created outside of the client. ' +
                'This may lead to unexpected results when querying the store internally. ' +
                "Please remove that option from ApolloClient constructor.");
        }
    });
    it('should allow for a single query to take place', function () {
        var query = (_a = ["\n      query people {\n        allPeople(first: 1) {\n          people {\n            name\n          }\n        }\n      }\n    "], _a.raw = ["\n      query people {\n        allPeople(first: 1) {\n          people {\n            name\n          }\n        }\n      }\n    "], graphql_tag_1.default(_a));
        var data = {
            allPeople: {
                people: [
                    {
                        name: 'Luke Skywalker',
                    },
                ],
            },
        };
        clientRoundrip(query, data);
        var _a;
    });
    it('should allow fragments on root query', function () {
        var query = (_a = ["\n      query {\n        ...QueryFragment\n        records {\n          id\n        }\n      }\n\n      fragment QueryFragment on Query {\n        records {\n          name\n        }\n      }\n    "], _a.raw = ["\n      query {\n        ...QueryFragment\n        records {\n          id\n        }\n      }\n\n      fragment QueryFragment on Query {\n        records {\n          name\n        }\n      }\n    "], graphql_tag_1.default(_a));
        var data = {
            records: [
                { id: 1, name: 'One' },
                { id: 2, name: 'Two' },
            ],
        };
        clientRoundrip(query, data);
        var _a;
    });
    it('should allow for a single query with existing store', function () {
        var query = (_a = ["\n      query people {\n        allPeople(first: 1) {\n          people {\n            name\n          }\n        }\n      }\n    "], _a.raw = ["\n      query people {\n        allPeople(first: 1) {\n          people {\n            name\n          }\n        }\n      }\n    "], graphql_tag_1.default(_a));
        var data = {
            allPeople: {
                people: [
                    {
                        name: 'Luke Skywalker',
                    },
                ],
            },
        };
        var networkInterface = src_1.mockNetworkInterface({
            request: { query: query },
            result: { data: data },
        });
        var client = new apollo_client_1.default({
            networkInterface: networkInterface,
            addTypename: false,
        });
        redux_1.createStore(redux_1.combineReducers({
            todos: redux_todomvc_1.rootReducer,
            apollo: client.reducer(),
        }), redux_1.applyMiddleware(client.middleware()));
        return client.query({ query: query })
            .then(function (result) {
            chai_1.assert.deepEqual(result.data, data);
        });
        var _a;
    });
    it('store can be rehydrated from the server', function () {
        var query = (_a = ["\n      query people {\n        allPeople(first: 1) {\n          people {\n            name\n          }\n        }\n      }\n    "], _a.raw = ["\n      query people {\n        allPeople(first: 1) {\n          people {\n            name\n          }\n        }\n      }\n    "], graphql_tag_1.default(_a));
        var data = {
            allPeople: {
                people: [
                    {
                        name: 'Luke Skywalker',
                    },
                ],
            },
        };
        var networkInterface = src_1.mockNetworkInterface({
            request: { query: query },
            result: { data: data },
        });
        var initialState = {
            apollo: {
                data: {
                    'ROOT_QUERY.allPeople({"first":"1"}).people.0': {
                        name: 'Luke Skywalker',
                    },
                    'ROOT_QUERY.allPeople({"first":1})': {
                        people: [{
                                type: 'id',
                                generated: true,
                                id: 'ROOT_QUERY.allPeople({"first":"1"}).people.0',
                            }],
                    },
                    ROOT_QUERY: {
                        'allPeople({"first":1})': {
                            type: 'id',
                            id: 'ROOT_QUERY.allPeople({"first":1})',
                            generated: true,
                        },
                    },
                },
                optimistic: [],
            },
        };
        var finalState = { apollo: lodash_1.assign({}, initialState.apollo, {
                queries: {
                    '0': {
                        queryString: printer_1.print(query),
                        variables: undefined,
                        loading: false,
                        networkStatus: store_1.NetworkStatus.ready,
                        stopped: false,
                        networkError: null,
                        graphQLErrors: null,
                        forceFetch: false,
                        returnPartialData: false,
                        lastRequestId: 1,
                        previousVariables: null,
                        metadata: null,
                    },
                },
                reducerError: null,
                mutations: {},
            }) };
        var client = new apollo_client_1.default({
            networkInterface: networkInterface,
            initialState: initialState,
            addTypename: false,
        });
        return client.query({ query: query })
            .then(function (result) {
            chai_1.assert.deepEqual(result.data, data);
            chai_1.assert.deepEqual(finalState, client.store.getState());
        });
        var _a;
    });
    it('allows for a single query with existing store and custom key', function () {
        var reduxRootKey = 'test';
        var query = (_a = ["\n      query people {\n        allPeople(first: 1) {\n          people {\n            name\n          }\n        }\n      }\n    "], _a.raw = ["\n      query people {\n        allPeople(first: 1) {\n          people {\n            name\n          }\n        }\n      }\n    "], graphql_tag_1.default(_a));
        var data = {
            allPeople: {
                people: [
                    {
                        name: 'Luke Skywalker',
                    },
                ],
            },
        };
        var networkInterface = src_1.mockNetworkInterface({
            request: { query: query },
            result: { data: data },
        });
        var client = src_3.withWarning(function () {
            return new apollo_client_1.default({
                reduxRootKey: reduxRootKey,
                networkInterface: networkInterface,
                addTypename: false,
            });
        }, /reduxRootKey/);
        redux_1.createStore(redux_1.combineReducers((_b = {
                todos: redux_todomvc_1.rootReducer
            },
            _b[reduxRootKey] = client.reducer(),
            _b
        )), redux_1.applyMiddleware(client.middleware()));
        return client.query({ query: query })
            .then(function (result) {
            chai_1.assert.deepEqual(result.data, data);
        });
        var _a, _b;
    });
    it('should return errors correctly for a single query', function () {
        var query = (_a = ["\n      query people {\n        allPeople(first: 1) {\n          people {\n            name\n          }\n        }\n      }\n    "], _a.raw = ["\n      query people {\n        allPeople(first: 1) {\n          people {\n            name\n          }\n        }\n      }\n    "], graphql_tag_1.default(_a));
        var errors = [
            {
                name: 'test',
                message: 'Syntax Error GraphQL request (8:9) Expected Name, found EOF',
            },
        ];
        var networkInterface = src_1.mockNetworkInterface({
            request: { query: query },
            result: { errors: errors },
        });
        var client = new apollo_client_1.default({
            networkInterface: networkInterface,
            addTypename: false,
        });
        return client.query({ query: query })
            .catch(function (error) {
            chai_1.assert.deepEqual(error.graphQLErrors, errors);
        });
        var _a;
    });
    it('should allow for subscribing to a request', function (done) {
        var query = (_a = ["\n      query people {\n        allPeople(first: 1) {\n          people {\n            name\n          }\n        }\n      }\n    "], _a.raw = ["\n      query people {\n        allPeople(first: 1) {\n          people {\n            name\n          }\n        }\n      }\n    "], graphql_tag_1.default(_a));
        var data = {
            allPeople: {
                people: [
                    {
                        name: 'Luke Skywalker',
                    },
                ],
            },
        };
        var networkInterface = src_1.mockNetworkInterface({
            request: { query: query },
            result: { data: data },
        });
        var client = new apollo_client_1.default({
            networkInterface: networkInterface,
            addTypename: false,
        });
        var handle = client.watchQuery({ query: query });
        handle.subscribe({
            next: function (result) {
                chai_1.assert.deepEqual(result.data, data);
                done();
            },
        });
        var _a;
    });
    it('should be able to transform queries', function (done) {
        var query = (_a = ["\n      query {\n        author {\n          firstName\n          lastName\n        }\n      }"], _a.raw = ["\n      query {\n        author {\n          firstName\n          lastName\n        }\n      }"], graphql_tag_1.default(_a));
        var transformedQuery = (_b = ["\n      query {\n        author {\n          firstName\n          lastName\n          __typename\n        }\n      }"], _b.raw = ["\n      query {\n        author {\n          firstName\n          lastName\n          __typename\n        }\n      }"], graphql_tag_1.default(_b));
        var result = {
            'author': {
                'firstName': 'John',
                'lastName': 'Smith',
            },
        };
        var transformedResult = {
            'author': {
                'firstName': 'John',
                'lastName': 'Smith',
                '__typename': 'Author',
            },
        };
        var networkInterface = src_1.mockNetworkInterface({
            request: { query: query },
            result: { data: result },
        }, {
            request: { query: transformedQuery },
            result: { data: transformedResult },
        });
        var client = new apollo_client_1.default({
            networkInterface: networkInterface,
            addTypename: true,
        });
        client.query({ query: query }).then(function (actualResult) {
            chai_1.assert.deepEqual(actualResult.data, transformedResult);
            done();
        });
        var _a, _b;
    });
    it('should be able to transform queries on forced fetches', function (done) {
        var query = (_a = ["\n      query {\n        author {\n          firstName\n          lastName\n        }\n      }"], _a.raw = ["\n      query {\n        author {\n          firstName\n          lastName\n        }\n      }"], graphql_tag_1.default(_a));
        var transformedQuery = (_b = ["\n      query {\n        author {\n          firstName\n          lastName\n          __typename\n        }\n      }"], _b.raw = ["\n      query {\n        author {\n          firstName\n          lastName\n          __typename\n        }\n      }"], graphql_tag_1.default(_b));
        var result = {
            'author': {
                'firstName': 'John',
                'lastName': 'Smith',
            },
        };
        var transformedResult = {
            'author': {
                'firstName': 'John',
                'lastName': 'Smith',
                '__typename': 'Author',
            },
        };
        var networkInterface = src_1.mockNetworkInterface({
            request: { query: query },
            result: { data: result },
        }, {
            request: { query: transformedQuery },
            result: { data: transformedResult },
        });
        var client = new apollo_client_1.default({
            networkInterface: networkInterface,
            addTypename: true,
        });
        client.query({ forceFetch: true, query: query }).then(function (actualResult) {
            chai_1.assert.deepEqual(actualResult.data, transformedResult);
            done();
        });
        var _a, _b;
    });
    it('should handle named fragments on mutations', function (done) {
        var mutation = (_a = ["\n      mutation {\n        starAuthor(id: 12) {\n          author {\n            ...authorDetails\n          }\n        }\n      }\n      fragment authorDetails on Author {\n        firstName\n        lastName\n      }"], _a.raw = ["\n      mutation {\n        starAuthor(id: 12) {\n          author {\n            ...authorDetails\n          }\n        }\n      }\n      fragment authorDetails on Author {\n        firstName\n        lastName\n      }"], graphql_tag_1.default(_a));
        var result = {
            'starAuthor': {
                'author': {
                    'firstName': 'John',
                    'lastName': 'Smith',
                },
            },
        };
        var networkInterface = src_1.mockNetworkInterface({
            request: { query: mutation },
            result: { data: result },
        });
        var client = new apollo_client_1.default({
            networkInterface: networkInterface,
            addTypename: false,
        });
        client.mutate({ mutation: mutation }).then(function (actualResult) {
            chai_1.assert.deepEqual(actualResult.data, result);
            done();
        });
        var _a;
    });
    it('should be able to handle named fragments on forced fetches', function () {
        var query = (_a = ["\n      fragment authorDetails on Author {\n        firstName\n        lastName\n      }\n      query {\n        author {\n          __typename\n          ...authorDetails\n        }\n      }"], _a.raw = ["\n      fragment authorDetails on Author {\n        firstName\n        lastName\n      }\n      query {\n        author {\n          __typename\n          ...authorDetails\n        }\n      }"], graphql_tag_1.default(_a));
        var result = {
            'author': {
                __typename: 'Author',
                'firstName': 'John',
                'lastName': 'Smith',
            },
        };
        var networkInterface = src_1.mockNetworkInterface({
            request: { query: query },
            result: { data: result },
        });
        var client = new apollo_client_1.default({
            networkInterface: networkInterface,
            addTypename: false,
        });
        return client.query({ forceFetch: true, query: query }).then(function (actualResult) {
            chai_1.assert.deepEqual(actualResult.data, result);
        });
        var _a;
    });
    it('should be able to handle named fragments with multiple fragments', function () {
        var query = (_a = ["\n      query {\n        author {\n          __typename\n          ...authorDetails\n          ...moreDetails\n        }\n      }\n      fragment authorDetails on Author {\n        firstName\n        lastName\n      }\n      fragment moreDetails on Author {\n        address\n      }"], _a.raw = ["\n      query {\n        author {\n          __typename\n          ...authorDetails\n          ...moreDetails\n        }\n      }\n      fragment authorDetails on Author {\n        firstName\n        lastName\n      }\n      fragment moreDetails on Author {\n        address\n      }"], graphql_tag_1.default(_a));
        var result = {
            'author': {
                __typename: 'Author',
                'firstName': 'John',
                'lastName': 'Smith',
                'address': '1337 10th St.',
            },
        };
        var networkInterface = src_1.mockNetworkInterface({
            request: { query: query },
            result: { data: result },
        });
        var client = new apollo_client_1.default({
            networkInterface: networkInterface,
            addTypename: false,
        });
        return client.query({ query: query }).then(function (actualResult) {
            chai_1.assert.deepEqual(actualResult.data, result);
        });
        var _a;
    });
    it('should be able to handle named fragments', function (done) {
        var query = (_a = ["\n      query {\n        author {\n          __typename\n          ...authorDetails\n        }\n      }\n      fragment authorDetails on Author {\n        firstName\n        lastName\n      }"], _a.raw = ["\n      query {\n        author {\n          __typename\n          ...authorDetails\n        }\n      }\n      fragment authorDetails on Author {\n        firstName\n        lastName\n      }"], graphql_tag_1.default(_a));
        var result = {
            'author': {
                __typename: 'Author',
                'firstName': 'John',
                'lastName': 'Smith',
            },
        };
        var networkInterface = src_1.mockNetworkInterface({
            request: { query: query },
            result: { data: result },
        });
        var client = new apollo_client_1.default({
            networkInterface: networkInterface,
            addTypename: false,
        });
        client.query({ query: query }).then(function (actualResult) {
            chai_1.assert.deepEqual(actualResult.data, result);
            done();
        });
        var _a;
    });
    it('should send operationName along with the query to the server', function (done) {
        var query = (_a = ["\n      query myQueryName {\n        fortuneCookie\n      }"], _a.raw = ["\n      query myQueryName {\n        fortuneCookie\n      }"], graphql_tag_1.default(_a));
        var data = {
            'fortuneCookie': 'The waiter spit in your food',
        };
        var networkInterface = {
            query: function (request) {
                chai_1.assert.equal(request.operationName, 'myQueryName');
                return Promise.resolve({ data: data });
            },
        };
        var client = new apollo_client_1.default({
            networkInterface: networkInterface,
            addTypename: false,
        });
        client.query({ query: query }).then(function (actualResult) {
            chai_1.assert.deepEqual(actualResult.data, data);
            done();
        });
        var _a;
    });
    it('should send operationName along with the mutation to the server', function (done) {
        var mutation = (_a = ["\n      mutation myMutationName {\n        fortuneCookie\n      }"], _a.raw = ["\n      mutation myMutationName {\n        fortuneCookie\n      }"], graphql_tag_1.default(_a));
        var data = {
            'fortuneCookie': 'The waiter spit in your food',
        };
        var networkInterface = {
            query: function (request) {
                chai_1.assert.equal(request.operationName, 'myMutationName');
                return Promise.resolve({ data: data });
            },
        };
        var client = new apollo_client_1.default({
            networkInterface: networkInterface,
            addTypename: false,
        });
        client.mutate({ mutation: mutation }).then(function (actualResult) {
            chai_1.assert.deepEqual(actualResult.data, data);
            done();
        });
        var _a;
    });
    describe('accepts dataIdFromObject option', function () {
        var query = (_a = ["\n      query people {\n        allPeople(first: 1) {\n          people {\n            id\n            name\n          }\n        }\n      }\n    "], _a.raw = ["\n      query people {\n        allPeople(first: 1) {\n          people {\n            id\n            name\n          }\n        }\n      }\n    "], graphql_tag_1.default(_a));
        var data = {
            allPeople: {
                people: [
                    {
                        id: '1',
                        name: 'Luke Skywalker',
                    },
                ],
            },
        };
        it('for internal store', function () {
            var networkInterface = src_1.mockNetworkInterface({
                request: { query: query },
                result: { data: data },
            });
            var client = new apollo_client_1.default({
                networkInterface: networkInterface,
                dataIdFromObject: function (obj) { return obj.id; },
                addTypename: false,
            });
            return client.query({ query: query })
                .then(function (result) {
                chai_1.assert.deepEqual(result.data, data);
                chai_1.assert.deepEqual(client.store.getState()['apollo'].data['1'], {
                    id: '1',
                    name: 'Luke Skywalker',
                });
            });
        });
        it('for existing store', function () {
            var networkInterface = src_1.mockNetworkInterface({
                request: { query: query },
                result: { data: data },
            });
            var client = new apollo_client_1.default({
                networkInterface: networkInterface,
                dataIdFromObject: function (obj) { return obj.id; },
                addTypename: false,
            });
            var store = redux_1.createStore(redux_1.combineReducers({
                apollo: client.reducer(),
            }), redux_1.applyMiddleware(client.middleware()));
            return client.query({ query: query })
                .then(function (result) {
                chai_1.assert.deepEqual(result.data, data);
                chai_1.assert.deepEqual(store.getState()['apollo'].data['1'], {
                    id: '1',
                    name: 'Luke Skywalker',
                });
            });
        });
        var _a;
    });
    describe('forceFetch', function () {
        var query = (_a = ["\n      query number {\n        myNumber {\n          n\n        }\n      }\n    "], _a.raw = ["\n      query number {\n        myNumber {\n          n\n        }\n      }\n    "], graphql_tag_1.default(_a));
        var firstFetch = {
            myNumber: {
                n: 1,
            },
        };
        var secondFetch = {
            myNumber: {
                n: 2,
            },
        };
        var networkInterface;
        var clock;
        beforeEach(function () {
            networkInterface = src_1.mockNetworkInterface({
                request: { query: query },
                result: { data: firstFetch },
            }, {
                request: { query: query },
                result: { data: secondFetch },
            });
        });
        afterEach(function () {
            if (clock) {
                clock.restore();
            }
        });
        it('forces the query to rerun', function () {
            var client = new apollo_client_1.default({
                networkInterface: networkInterface,
                addTypename: false,
            });
            return client.query({ query: query })
                .then(function () { return client.query({ query: query, forceFetch: true }); })
                .then(function (result) {
                chai_1.assert.deepEqual(result.data, { myNumber: { n: 2 } });
            });
        });
        it('can be disabled with ssrMode', function () {
            var client = new apollo_client_1.default({
                networkInterface: networkInterface,
                ssrMode: true,
                addTypename: false,
            });
            var options = { query: query, forceFetch: true };
            return client.query({ query: query })
                .then(function () { return client.query(options); })
                .then(function (result) {
                chai_1.assert.deepEqual(result.data, { myNumber: { n: 1 } });
                chai_1.assert.deepEqual(options, { query: query, forceFetch: true });
            });
        });
        it('can temporarily be disabled with ssrForceFetchDelay', function () {
            clock = sinon_1.useFakeTimers();
            var client = new apollo_client_1.default({
                networkInterface: networkInterface,
                ssrForceFetchDelay: 100,
                addTypename: false,
            });
            var outerPromise = client.query({ query: query })
                .then(function () {
                var promise = client.query({ query: query, forceFetch: true });
                clock.tick(0);
                return promise;
            })
                .then(function (result) {
                chai_1.assert.deepEqual(result.data, { myNumber: { n: 1 } });
                clock.tick(100);
                var promise = client.query({ query: query, forceFetch: true });
                clock.tick(0);
                return promise;
            })
                .then(function (result) {
                chai_1.assert.deepEqual(result.data, { myNumber: { n: 2 } });
            });
            clock.tick(0);
            return outerPromise;
        });
        var _a;
    });
    it('should expose a method called printAST that is prints graphql queries', function () {
        var query = (_a = ["\n      query {\n        fortuneCookie\n      }"], _a.raw = ["\n      query {\n        fortuneCookie\n      }"], graphql_tag_1.default(_a));
        chai_1.assert.equal(apollo_client_1.printAST(query), printer_1.print(query));
        var _a;
    });
    describe('fragment referencing', function () {
        afterEach(function () {
            apollo_client_1.clearFragmentDefinitions();
        });
        it('should return a fragment def with a unique name', function () {
            var fragment = (_a = ["\n        fragment authorDetails on Author {\n          author {\n            firstName\n            lastName\n          }\n        }\n      "], _a.raw = ["\n        fragment authorDetails on Author {\n          author {\n            firstName\n            lastName\n          }\n        }\n      "], graphql_tag_1.default(_a));
            var fragmentDefs = apollo_client_1.createFragment(fragment);
            chai_1.assert.equal(fragmentDefs.length, 1);
            chai_1.assert.equal(printer_1.print(fragmentDefs[0]), printer_1.print(getFromAST_1.getFragmentDefinitions(fragment)[0]));
            var _a;
        });
        it('should correctly return multiple fragments from a single document', function () {
            var fragmentDoc = (_a = ["\n        fragment authorDetails on Author {\n          firstName\n          lastName\n        }\n        fragment personDetails on Person {\n          name\n        }\n        "], _a.raw = ["\n        fragment authorDetails on Author {\n          firstName\n          lastName\n        }\n        fragment personDetails on Person {\n          name\n        }\n        "], graphql_tag_1.default(_a));
            var fragmentDefs = apollo_client_1.createFragment(fragmentDoc);
            chai_1.assert.equal(fragmentDefs.length, 2);
            var expFragmentDefs = getFromAST_1.getFragmentDefinitions(fragmentDoc);
            chai_1.assert.equal(printer_1.print(fragmentDefs[0]), printer_1.print(expFragmentDefs[0]));
            chai_1.assert.equal(printer_1.print(fragmentDefs[1]), printer_1.print(expFragmentDefs[1]));
            var _a;
        });
        it('should correctly return fragment defs with one fragment depending on another', function () {
            var fragmentDoc = (_a = ["\n        fragment authorDetails on Author {\n          firstName\n          lastName\n          ...otherAuthorDetails\n        }"], _a.raw = ["\n        fragment authorDetails on Author {\n          firstName\n          lastName\n          ...otherAuthorDetails\n        }"], graphql_tag_1.default(_a));
            var otherFragmentDoc = (_b = ["\n        fragment otherFragmentDoc on Author {\n          address\n        }"], _b.raw = ["\n        fragment otherFragmentDoc on Author {\n          address\n        }"], graphql_tag_1.default(_b));
            var fragmentDefs = apollo_client_1.createFragment(fragmentDoc, getFromAST_1.getFragmentDefinitions(otherFragmentDoc));
            chai_1.assert.equal(fragmentDefs.length, 2);
            var expFragmentDefs = getFromAST_1.getFragmentDefinitions(otherFragmentDoc)
                .concat(getFromAST_1.getFragmentDefinitions(fragmentDoc));
            chai_1.assert.deepEqual(fragmentDefs.map(printer_1.print), expFragmentDefs.map(printer_1.print));
            var _a, _b;
        });
        it('should return fragment defs with a multiple fragments depending on other fragments', function () {
            var fragmentDoc = (_a = ["\n        fragment authorDetails on Author {\n          firstName\n          lastName\n          ...otherAuthorDetails\n        }\n\n        fragment onlineAuthorDetails on Author {\n          email\n          ...otherAuthorDetails\n        }"], _a.raw = ["\n        fragment authorDetails on Author {\n          firstName\n          lastName\n          ...otherAuthorDetails\n        }\n\n        fragment onlineAuthorDetails on Author {\n          email\n          ...otherAuthorDetails\n        }"], graphql_tag_1.default(_a));
            var otherFragmentDoc = (_b = ["\n        fragment otherAuthorDetails on Author {\n          address\n        }"], _b.raw = ["\n        fragment otherAuthorDetails on Author {\n          address\n        }"], graphql_tag_1.default(_b));
            var fragmentDefs = apollo_client_1.createFragment(fragmentDoc, getFromAST_1.getFragmentDefinitions(otherFragmentDoc));
            chai_1.assert.equal(fragmentDefs.length, 3);
            var expFragmentDefs = getFromAST_1.getFragmentDefinitions(otherFragmentDoc)
                .concat(getFromAST_1.getFragmentDefinitions(fragmentDoc));
            chai_1.assert.deepEqual(fragmentDefs.map(printer_1.print), expFragmentDefs.map(printer_1.print));
            var _a, _b;
        });
        it('should always return a flat array of fragment defs', function () {
            var fragmentDoc1 = (_a = ["\n        fragment authorDetails on Author {\n          firstName\n          lastName\n          ...otherAuthorDetails\n        }"], _a.raw = ["\n        fragment authorDetails on Author {\n          firstName\n          lastName\n          ...otherAuthorDetails\n        }"], graphql_tag_1.default(_a));
            var fragmentDoc2 = (_b = ["\n        fragment otherAuthorDetails on Author {\n          address\n        }"], _b.raw = ["\n        fragment otherAuthorDetails on Author {\n          address\n        }"], graphql_tag_1.default(_b));
            var fragmentDoc3 = (_c = ["\n        fragment personDetails on Person {\n          personDetails\n        }"], _c.raw = ["\n        fragment personDetails on Person {\n          personDetails\n        }"], graphql_tag_1.default(_c));
            var fragments1 = apollo_client_1.createFragment(fragmentDoc1);
            var fragments2 = apollo_client_1.createFragment(fragmentDoc2);
            var fragments3 = apollo_client_1.createFragment(fragmentDoc3, [fragments1, fragments2]);
            chai_1.assert.equal(fragments1.length, 1);
            chai_1.assert.equal(fragments2.length, 1);
            chai_1.assert.equal(fragments3.length, 3);
            var _a, _b, _c;
        });
        it('should add a fragment to the fragmentDefinitionsMap', function () {
            var fragmentDoc = (_a = ["\n        fragment authorDetails on Author {\n          firstName\n          lastName\n        }"], _a.raw = ["\n        fragment authorDetails on Author {\n          firstName\n          lastName\n        }"], graphql_tag_1.default(_a));
            chai_1.assert.equal(Object.keys(fragments_1.fragmentDefinitionsMap).length, 0);
            apollo_client_1.createFragment(fragmentDoc);
            chai_1.assert.equal(Object.keys(fragments_1.fragmentDefinitionsMap).length, 1);
            chai_1.assert(fragments_1.fragmentDefinitionsMap.hasOwnProperty('authorDetails'));
            chai_1.assert.equal(fragments_1.fragmentDefinitionsMap['authorDetails'].length, 1);
            chai_1.assert.equal(printer_1.print(fragments_1.fragmentDefinitionsMap['authorDetails']), printer_1.print(getFromAST_1.getFragmentDefinitions(fragmentDoc)[0]));
            var _a;
        });
        it('should add fragments with the same name to fragmentDefinitionsMap + print warning', function () {
            var fragmentDoc = (_a = ["\n        fragment authorDetails on Author {\n          firstName\n          lastName\n        }\n        fragment authorDetails on Author {\n          address\n        }"], _a.raw = ["\n        fragment authorDetails on Author {\n          firstName\n          lastName\n        }\n        fragment authorDetails on Author {\n          address\n        }"], graphql_tag_1.default(_a));
            var oldWarn = console.warn;
            console.warn = function (str) {
                chai_1.assert.include(str, 'Warning: fragment with name');
            };
            apollo_client_1.createFragment(fragmentDoc);
            chai_1.assert.equal(Object.keys(fragments_1.fragmentDefinitionsMap).length, 1);
            chai_1.assert.equal(fragments_1.fragmentDefinitionsMap['authorDetails'].length, 2);
            console.warn = oldWarn;
            var _a;
        });
        it('should issue a warning if we try query with a conflicting fragment name', function () {
            apollo_client_1.enableFragmentWarnings();
            var client = new apollo_client_1.default({
                networkInterface: src_1.mockNetworkInterface(),
                addTypename: false,
            });
            var fragmentDoc = (_a = ["\n        fragment authorDetails on Author {\n          firstName\n          lastName\n        }"], _a.raw = ["\n        fragment authorDetails on Author {\n          firstName\n          lastName\n        }"], graphql_tag_1.default(_a));
            var queryDoc = (_b = ["\n        query {\n          author {\n            firstName\n            lastName\n          }\n        }\n        fragment authorDetails on Author {\n          firstName\n          lastName\n        }"], _b.raw = ["\n        query {\n          author {\n            firstName\n            lastName\n          }\n        }\n        fragment authorDetails on Author {\n          firstName\n          lastName\n        }"], graphql_tag_1.default(_b));
            apollo_client_1.createFragment(fragmentDoc);
            src_3.withWarning(function () {
                client.query({ query: queryDoc });
            }, /Warning: fragment with name/);
            apollo_client_1.disableFragmentWarnings();
            var _a, _b;
        });
        it('should issue a warning if we try to watchQuery with a conflicting fragment name', function () {
            apollo_client_1.enableFragmentWarnings();
            var client = new apollo_client_1.default({
                networkInterface: src_1.mockNetworkInterface(),
                addTypename: false,
            });
            var fragmentDoc = (_a = ["\n        fragment authorDetails on Author {\n          firstName\n          lastName\n        }"], _a.raw = ["\n        fragment authorDetails on Author {\n          firstName\n          lastName\n        }"], graphql_tag_1.default(_a));
            var queryDoc = (_b = ["\n        query {\n          author {\n            firstName\n            lastName\n          }\n        }\n        fragment authorDetails on Author {\n          firstName\n          lastName\n        }"], _b.raw = ["\n        query {\n          author {\n            firstName\n            lastName\n          }\n        }\n        fragment authorDetails on Author {\n          firstName\n          lastName\n        }"], graphql_tag_1.default(_b));
            apollo_client_1.createFragment(fragmentDoc);
            src_3.withWarning(function () {
                client.watchQuery({ query: queryDoc });
            }, /Warning: fragment with name/);
            apollo_client_1.disableFragmentWarnings();
            var _a, _b;
        });
        it('should allow passing fragments to query', function () {
            var queryDoc = (_a = ["\n        query {\n          author {\n            __typename\n            ...authorDetails\n          }\n        }"], _a.raw = ["\n        query {\n          author {\n            __typename\n            ...authorDetails\n          }\n        }"], graphql_tag_1.default(_a));
            var composedQuery = (_b = ["\n        query {\n          author {\n            __typename\n            ...authorDetails\n          }\n        }\n        fragment authorDetails on Author {\n          firstName\n          lastName\n        }"], _b.raw = ["\n        query {\n          author {\n            __typename\n            ...authorDetails\n          }\n        }\n        fragment authorDetails on Author {\n          firstName\n          lastName\n        }"], graphql_tag_1.default(_b));
            var data = {
                author: {
                    __typename: 'Author',
                    firstName: 'John',
                    lastName: 'Smith',
                },
            };
            var networkInterface = src_1.mockNetworkInterface({
                request: { query: composedQuery },
                result: { data: data },
            });
            var client = new apollo_client_1.default({
                networkInterface: networkInterface,
                addTypename: false,
            });
            var fragmentDefs = apollo_client_1.createFragment((_c = ["\n        fragment authorDetails on Author {\n          firstName\n          lastName\n        }"], _c.raw = ["\n        fragment authorDetails on Author {\n          firstName\n          lastName\n        }"], graphql_tag_1.default(_c)));
            return client.query({ query: queryDoc, fragments: fragmentDefs }).then(function (result) {
                chai_1.assert.deepEqual(result.data, data);
            });
            var _a, _b, _c;
        });
        it('show allow passing fragments to mutate', function () {
            var mutationDoc = (_a = ["\n        mutation createAuthor {\n          createAuthor {\n            __typename\n            ...authorDetails\n          }\n        }"], _a.raw = ["\n        mutation createAuthor {\n          createAuthor {\n            __typename\n            ...authorDetails\n          }\n        }"], graphql_tag_1.default(_a));
            var composedMutation = (_b = ["\n        mutation createAuthor {\n          createAuthor {\n            __typename\n            ...authorDetails\n          }\n        }\n        fragment authorDetails on Author {\n          firstName\n          lastName\n        }"], _b.raw = ["\n        mutation createAuthor {\n          createAuthor {\n            __typename\n            ...authorDetails\n          }\n        }\n        fragment authorDetails on Author {\n          firstName\n          lastName\n        }"], graphql_tag_1.default(_b));
            var data = {
                createAuthor: {
                    __typename: 'Author',
                    firstName: 'John',
                    lastName: 'Smith',
                },
            };
            var networkInterface = src_1.mockNetworkInterface({
                request: { query: composedMutation },
                result: { data: data },
            });
            var client = new apollo_client_1.default({
                networkInterface: networkInterface,
                addTypename: false,
            });
            var fragmentDefs = apollo_client_1.createFragment((_c = ["\n        fragment authorDetails on Author {\n          firstName\n          lastName\n        }"], _c.raw = ["\n        fragment authorDetails on Author {\n          firstName\n          lastName\n        }"], graphql_tag_1.default(_c)));
            return client.mutate({ mutation: mutationDoc, fragments: fragmentDefs }).then(function (result) {
                chai_1.assert.deepEqual(result, { data: data });
            });
            var _a, _b, _c;
        });
        it('should allow passing fragments to watchQuery', function () {
            var queryDoc = (_a = ["\n        query {\n          author {\n            __typename\n            ...authorDetails\n          }\n        }"], _a.raw = ["\n        query {\n          author {\n            __typename\n            ...authorDetails\n          }\n        }"], graphql_tag_1.default(_a));
            var composedQuery = (_b = ["\n        query {\n          author {\n            __typename\n            ...authorDetails\n          }\n        }\n        fragment authorDetails on Author {\n          firstName\n          lastName\n        }"], _b.raw = ["\n        query {\n          author {\n            __typename\n            ...authorDetails\n          }\n        }\n        fragment authorDetails on Author {\n          firstName\n          lastName\n        }"], graphql_tag_1.default(_b));
            var data = {
                author: {
                    __typename: 'Author',
                    firstName: 'John',
                    lastName: 'Smith',
                },
            };
            var networkInterface = src_1.mockNetworkInterface({
                request: { query: composedQuery },
                result: { data: data },
            });
            var client = new apollo_client_1.default({
                networkInterface: networkInterface,
                addTypename: false,
            });
            var fragmentDefs = apollo_client_1.createFragment((_c = ["\n        fragment authorDetails on Author {\n          firstName\n          lastName\n        }"], _c.raw = ["\n        fragment authorDetails on Author {\n          firstName\n          lastName\n        }"], graphql_tag_1.default(_c)));
            var observable = client.watchQuery({ query: queryDoc, fragments: fragmentDefs });
            return src_2.observableToPromise({ observable: observable }, function (result) {
                chai_1.assert.deepEqual(result.data, data);
            });
            var _a, _b, _c;
        });
        it('should allow passing fragments in polling queries', function () {
            var queryDoc = (_a = ["\n        query {\n          author {\n            __typename\n            ...authorDetails\n          }\n        }"], _a.raw = ["\n        query {\n          author {\n            __typename\n            ...authorDetails\n          }\n        }"], graphql_tag_1.default(_a));
            var composedQuery = (_b = ["\n        query {\n          author {\n            __typename\n            ...authorDetails\n          }\n        }\n        fragment authorDetails on Author {\n          firstName\n          lastName\n        }"], _b.raw = ["\n        query {\n          author {\n            __typename\n            ...authorDetails\n          }\n        }\n        fragment authorDetails on Author {\n          firstName\n          lastName\n        }"], graphql_tag_1.default(_b));
            var data = {
                author: {
                    __typename: 'Author',
                    firstName: 'John',
                    lastName: 'Smith',
                },
            };
            var networkInterface = src_1.mockNetworkInterface({
                request: { query: composedQuery },
                result: { data: data },
            });
            var client = new apollo_client_1.default({
                networkInterface: networkInterface,
                addTypename: false,
            });
            var fragmentDefs = apollo_client_1.createFragment((_c = ["\n        fragment authorDetails on Author {\n          firstName\n          lastName\n        }"], _c.raw = ["\n        fragment authorDetails on Author {\n          firstName\n          lastName\n        }"], graphql_tag_1.default(_c)));
            var observable = client.watchQuery({
                query: queryDoc,
                pollInterval: 30,
                fragments: fragmentDefs,
            });
            return src_2.observableToPromise({ observable: observable }, function (result) {
                chai_1.assert.deepEqual(result.data, data);
            });
            var _a, _b, _c;
        });
        it('should not mutate the input document when querying', function () {
            var client = new apollo_client_1.default();
            var fragments = apollo_client_1.createFragment((_a = ["\n        fragment authorDetails on Author {\n          author {\n            firstName\n            lastName\n          }\n        }"], _a.raw = ["\n        fragment authorDetails on Author {\n          author {\n            firstName\n            lastName\n          }\n        }"], graphql_tag_1.default(_a)));
            var query = (_b = ["{ author { ...authorDetails } }"], _b.raw = ["{ author { ...authorDetails } }"], graphql_tag_1.default(_b));
            var initialDefinitions = query.definitions;
            client.query({ query: query, fragments: fragments });
            chai_1.assert.equal(query.definitions, initialDefinitions);
            var _a, _b;
        });
    });
    it('should pass a network error correctly on a mutation', function (done) {
        var mutation = (_a = ["\n      mutation {\n        person {\n          firstName\n          lastName\n        }\n      }"], _a.raw = ["\n      mutation {\n        person {\n          firstName\n          lastName\n        }\n      }"], graphql_tag_1.default(_a));
        var data = {
            person: {
                firstName: 'John',
                lastName: 'Smith',
            },
        };
        var networkError = new Error('Some kind of network error.');
        var client = new apollo_client_1.default({
            networkInterface: src_1.mockNetworkInterface({
                request: { query: mutation },
                result: { data: data },
                error: networkError,
            }),
            addTypename: false,
        });
        client.mutate({ mutation: mutation }).then(function (result) {
            done(new Error('Returned a result when it should not have.'));
        }).catch(function (error) {
            chai_1.assert(error.networkError);
            chai_1.assert.equal(error.networkError.message, networkError.message);
            done();
        });
        var _a;
    });
    it('should pass a GraphQL error correctly on a mutation', function (done) {
        var mutation = (_a = ["\n      mutation {\n        newPerson {\n          person {\n            firstName\n            lastName\n          }\n        }\n      }"], _a.raw = ["\n      mutation {\n        newPerson {\n          person {\n            firstName\n            lastName\n          }\n        }\n      }"], graphql_tag_1.default(_a));
        var data = {
            person: {
                firstName: 'John',
                lastName: 'Smith',
            },
        };
        var errors = [new Error('Some kind of GraphQL error.')];
        var client = new apollo_client_1.default({
            networkInterface: src_1.mockNetworkInterface({
                request: { query: mutation },
                result: { data: data, errors: errors },
            }),
            addTypename: false,
        });
        client.mutate({ mutation: mutation }).then(function (result) {
            done(new Error('Returned a result when it should not have.'));
        }).catch(function (error) {
            chai_1.assert(error.graphQLErrors);
            chai_1.assert.equal(error.graphQLErrors.length, 1);
            chai_1.assert.equal(error.graphQLErrors[0].message, errors[0].message);
            done();
        });
        var _a;
    });
    it('has a resetStore method which calls QueryManager', function (done) {
        var client = new apollo_client_1.default();
        client.queryManager = {
            resetStore: function () {
                done();
            },
        };
        client.resetStore();
    });
    it('should allow us to create a network interface with transport-level batching', function (done) {
        var firstQuery = (_a = ["\n      query {\n        author {\n          firstName\n          lastName\n        }\n      }"], _a.raw = ["\n      query {\n        author {\n          firstName\n          lastName\n        }\n      }"], graphql_tag_1.default(_a));
        var firstResult = {
            data: {
                author: {
                    firstName: 'John',
                    lastName: 'Smith',
                },
            },
            loading: false,
        };
        var secondQuery = (_b = ["\n      query {\n        person {\n          name\n        }\n      }"], _b.raw = ["\n      query {\n        person {\n          name\n        }\n      }"], graphql_tag_1.default(_b));
        var secondResult = {
            data: {
                person: {
                    name: 'Jane Smith',
                },
            },
        };
        var url = 'http://not-a-real-url.com';
        fetch = src_2.createMockFetch({
            url: url,
            opts: {
                body: JSON.stringify([
                    {
                        query: printer_1.print(firstQuery),
                    },
                    {
                        query: printer_1.print(secondQuery),
                    },
                ]),
                headers: {
                    Accept: '*/*',
                    'Content-Type': 'application/json',
                },
                method: 'POST',
            },
            result: src_2.createMockedIResponse([firstResult, secondResult]),
        });
        var networkInterface = batchedNetworkInterface_1.createBatchingNetworkInterface({
            uri: 'http://not-a-real-url.com',
            batchInterval: 5,
            opts: {},
        });
        Promise.all([
            networkInterface.query({ query: firstQuery }),
            networkInterface.query({ query: secondQuery }),
        ]).then(function (results) {
            chai_1.assert.deepEqual(results, [firstResult, secondResult]);
            done();
        }).catch(function (e) {
            console.error(e);
        });
        var _a, _b;
    });
    it('should throw an error if response to batch request is not an array', function (done) {
        var firstQuery = (_a = ["\n      query {\n        author {\n          firstName\n          lastName\n        }\n      }"], _a.raw = ["\n      query {\n        author {\n          firstName\n          lastName\n        }\n      }"], graphql_tag_1.default(_a));
        var firstResult = {
            data: {
                author: {
                    firstName: 'John',
                    lastName: 'Smith',
                },
            },
            loading: false,
        };
        var secondQuery = (_b = ["\n      query {\n        person {\n          name\n        }\n      }"], _b.raw = ["\n      query {\n        person {\n          name\n        }\n      }"], graphql_tag_1.default(_b));
        var url = 'http://not-a-real-url.com';
        fetch = src_2.createMockFetch({
            url: url,
            opts: {
                body: JSON.stringify([
                    {
                        query: printer_1.print(firstQuery),
                    },
                    {
                        query: printer_1.print(secondQuery),
                    },
                ]),
                headers: {
                    Accept: '*/*',
                    'Content-Type': 'application/json',
                },
                method: 'POST',
            },
            result: src_2.createMockedIResponse(firstResult),
        });
        var networkInterface = batchedNetworkInterface_1.createBatchingNetworkInterface({
            uri: 'http://not-a-real-url.com',
            batchInterval: 5,
            opts: {},
        });
        Promise.all([
            networkInterface.query({ query: firstQuery }),
            networkInterface.query({ query: secondQuery }),
        ]).then(function (results) {
            chai_1.assert.equal(true, false, 'expected response to throw an error');
        }).catch(function (e) {
            chai_1.assert.equal(e.message, 'BatchingNetworkInterface: server response is not an array');
            done();
        });
        var _a, _b;
    });
    it('should not do transport-level batching when the interval is exceeded', function (done) {
        var firstQuery = (_a = ["\n      query {\n        author {\n          firstName\n          lastName\n        }\n      }"], _a.raw = ["\n      query {\n        author {\n          firstName\n          lastName\n        }\n      }"], graphql_tag_1.default(_a));
        var firstResult = {
            data: {
                author: {
                    firstName: 'John',
                    lastName: 'Smith',
                },
            },
            loading: false,
        };
        var secondQuery = (_b = ["\n      query {\n        person {\n          name\n        }\n      }"], _b.raw = ["\n      query {\n        person {\n          name\n        }\n      }"], graphql_tag_1.default(_b));
        var secondResult = {
            data: {
                person: {
                    name: 'Jane Smith',
                },
            },
        };
        var url = 'http://not-a-real-url.com';
        fetch = src_2.createMockFetch({
            url: url,
            opts: {
                body: JSON.stringify([
                    {
                        query: printer_1.print(firstQuery),
                    },
                ]),
                headers: {
                    Accept: '*/*',
                    'Content-Type': 'application/json',
                },
                method: 'POST',
            },
            result: src_2.createMockedIResponse([firstResult]),
        }, {
            url: url,
            opts: {
                body: JSON.stringify([
                    {
                        query: printer_1.print(secondQuery),
                    },
                ]),
                headers: {
                    Accept: '*/*',
                    'Content-Type': 'application/json',
                },
                method: 'POST',
            },
            result: src_2.createMockedIResponse([secondResult]),
        });
        var networkInterface = batchedNetworkInterface_1.createBatchingNetworkInterface({
            uri: 'http://not-a-real-url.com',
            batchInterval: 5,
            opts: {},
        });
        Promise.all([
            networkInterface.query({ query: firstQuery }),
            new Promise(function (resolve, reject) {
                return setTimeout(function () { return resolve(networkInterface.query({ query: secondQuery })); }, 10);
            }),
        ]).then(function (results) {
            chai_1.assert.deepEqual(results, [firstResult, secondResult]);
            done();
        }).catch(function (e) {
            console.error(e);
        });
        var _a, _b;
    });
});
function clientRoundrip(query, data, variables, fragments) {
    var networkInterface = src_1.mockNetworkInterface({
        request: { query: lodash_1.cloneDeep(query) },
        result: { data: data },
    });
    var client = new apollo_client_1.default({
        networkInterface: networkInterface,
    });
    return client.query({ query: query, variables: variables, fragments: fragments })
        .then(function (result) {
        chai_1.assert.deepEqual(result.data, data);
    });
}
//# sourceMappingURL=client.js.map