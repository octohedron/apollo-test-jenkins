"use strict";
var lodash_1 = require('lodash');
var chai_1 = require('chai');
var graphql_tag_1 = require('graphql-tag');
var apollo_client_1 = require('apollo-client');
var actions_1 = require('apollo-client/actions');
var QueryManager_1 = require('apollo-client/core/QueryManager');
var store_1 = require('apollo-client/store');
var src_1 = require('../src');
describe('GraphQL Subscriptions', function () {
    var results = ['Dahivat Pandya', 'Vyacheslav Kim', 'Changping Chen', 'Amanda Liu'].map(function (name) { return ({ result: { user: { name: name } }, delay: 10 }); });
    var sub1;
    var options;
    var realOptions;
    var watchQueryOptions;
    var sub2;
    var commentsQuery;
    var commentsVariables;
    var commentsSub;
    var commentsResult;
    var commentsResultMore;
    var commentsWatchQueryOptions;
    beforeEach(function () {
        sub1 = {
            request: {
                query: (_a = ["\n          subscription UserInfo($name: String) {\n            user(name: $name) {\n              name\n            }\n          }\n        "], _a.raw = ["\n          subscription UserInfo($name: String) {\n            user(name: $name) {\n              name\n            }\n          }\n        "], graphql_tag_1.default(_a)),
                variables: {
                    name: 'Changping Chen',
                },
            },
            id: 0,
            results: results.slice(),
        };
        options = {
            query: (_b = ["\n        subscription UserInfo($name: String) {\n          user(name: $name) {\n            name\n          }\n        }\n      "], _b.raw = ["\n        subscription UserInfo($name: String) {\n          user(name: $name) {\n            name\n          }\n        }\n      "], graphql_tag_1.default(_b)),
            variables: {
                name: 'Changping Chen',
            },
        };
        realOptions = {
            document: (_c = ["\n        subscription UserInfo($name: String) {\n          user(name: $name) {\n            name\n          }\n        }\n      "], _c.raw = ["\n        subscription UserInfo($name: String) {\n          user(name: $name) {\n            name\n          }\n        }\n      "], graphql_tag_1.default(_c)),
            variables: {
                name: 'Changping Chen',
            },
        };
        watchQueryOptions = {
            query: (_d = ["\n        query UserInfo($name: String) {\n          user(name: $name) {\n            name\n          }\n        }\n      "], _d.raw = ["\n        query UserInfo($name: String) {\n          user(name: $name) {\n            name\n          }\n        }\n      "], graphql_tag_1.default(_d)),
            variables: {
                name: 'Changping Chen',
            },
        };
        commentsQuery = (_e = ["\n      query Comment($repoName: String!) {\n        entry(repoFullName: $repoName) {\n          comments {\n            text\n          }\n        }\n      }\n    "], _e.raw = ["\n      query Comment($repoName: String!) {\n        entry(repoFullName: $repoName) {\n          comments {\n            text\n          }\n        }\n      }\n    "], graphql_tag_1.default(_e));
        commentsSub = (_f = ["\n      subscription getNewestComment($repoName: String!) {\n        getNewestComment(repoName: $repoName) {\n          text\n        }\n      }"], _f.raw = ["\n      subscription getNewestComment($repoName: String!) {\n        getNewestComment(repoName: $repoName) {\n          text\n        }\n      }"], graphql_tag_1.default(_f));
        commentsVariables = {
            repoName: 'org/repo',
        };
        commentsWatchQueryOptions = {
            query: commentsQuery,
            variables: commentsVariables,
        };
        commentsResult = {
            data: {
                entry: {
                    comments: [],
                },
            },
        };
        commentsResultMore = {
            result: {
                entry: {
                    comments: [],
                },
            },
        };
        for (var i = 1; i <= 10; i++) {
            commentsResult.data.entry.comments.push({ text: "comment " + i });
        }
        for (var i = 11; i < 12; i++) {
            commentsResultMore.result.entry.comments.push({ text: "comment " + i });
        }
        sub2 = {
            request: {
                query: commentsSub,
                variables: commentsVariables,
            },
            id: 0,
            results: [commentsResultMore],
        };
        var _a, _b, _c, _d, _e, _f;
    });
    it('should start a subscription on network interface and unsubscribe', function (done) {
        var network = src_1.mockSubscriptionNetworkInterface([sub1]);
        var client = new apollo_client_1.default({
            networkInterface: network,
            addTypename: false,
        });
        var sub = client.subscribe(options).subscribe({
            next: function (result) {
                chai_1.assert.deepEqual(result, results[0].result);
                sub.unsubscribe();
                chai_1.assert.equal(Object.keys(network.mockedSubscriptionsById).length, 0);
                done();
            },
        });
        var id = sub._networkSubscriptionId;
        network.fireResult(id);
        chai_1.assert.equal(Object.keys(network.mockedSubscriptionsById).length, 1);
    });
    it('should multiplex subscriptions', function (done) {
        var network = src_1.mockSubscriptionNetworkInterface([sub1]);
        var queryManager = new QueryManager_1.QueryManager({
            networkInterface: network,
            reduxRootSelector: function (state) { return state.apollo; },
            store: store_1.createApolloStore(),
            addTypename: false,
        });
        var obs = queryManager.startGraphQLSubscription(realOptions);
        var counter = 0;
        var sub = obs.subscribe({
            next: function (result) {
                chai_1.assert.deepEqual(result, results[0].result);
                counter++;
                if (counter === 2) {
                    done();
                }
            },
        });
        obs.subscribe({
            next: function (result) {
                chai_1.assert.deepEqual(result, results[0].result);
                counter++;
                if (counter === 2) {
                    done();
                }
            },
        });
        var id = sub._networkSubscriptionId;
        network.fireResult(id);
    });
    it('should receive multiple results for a subscription', function (done) {
        var network = src_1.mockSubscriptionNetworkInterface([sub1]);
        var numResults = 0;
        var queryManager = new QueryManager_1.QueryManager({
            networkInterface: network,
            reduxRootSelector: function (state) { return state.apollo; },
            store: store_1.createApolloStore(),
            addTypename: false,
        });
        var sub = queryManager.startGraphQLSubscription(realOptions).subscribe({
            next: function (result) {
                chai_1.assert.deepEqual(result, results[numResults].result);
                numResults++;
                if (numResults === 4) {
                    done();
                }
            },
        });
        var id = sub._networkSubscriptionId;
        for (var i = 0; i < 4; i++) {
            network.fireResult(id);
        }
    });
    it('should fire redux action and call result reducers', function (done) {
        var query = (_a = ["\n      query miniQuery {\n        number\n      }\n    "], _a.raw = ["\n      query miniQuery {\n        number\n      }\n    "], graphql_tag_1.default(_a));
        var res = {
            data: {
                number: 0,
            },
        };
        var req1 = {
            request: { query: query },
            result: res,
        };
        var network = src_1.mockSubscriptionNetworkInterface([sub1], req1);
        var numResults = 0;
        var counter = 0;
        var queryManager = new QueryManager_1.QueryManager({
            networkInterface: network,
            reduxRootSelector: function (state) { return state.apollo; },
            store: store_1.createApolloStore(),
            addTypename: false,
        });
        var observableQuery = queryManager.watchQuery({
            query: query,
            reducer: function (previousResult, action) {
                counter++;
                if (actions_1.isSubscriptionResultAction(action)) {
                    var newResult = lodash_1.cloneDeep(previousResult);
                    newResult.number++;
                    return newResult;
                }
                return previousResult;
            },
        }).subscribe({
            next: function () { return null; },
        });
        var sub = queryManager.startGraphQLSubscription(realOptions).subscribe({
            next: function (result) {
                chai_1.assert.deepEqual(result, results[numResults].result);
                numResults++;
                if (numResults === 4) {
                    observableQuery.unsubscribe();
                    chai_1.assert.equal(counter, 5);
                    chai_1.assert.equal(queryManager.store.getState()['apollo']['data']['ROOT_QUERY']['number'], 4);
                    done();
                }
            },
        });
        var id = sub._networkSubscriptionId;
        for (var i = 0; i < 4; i++) {
            network.fireResult(id);
        }
        var _a;
    });
});
//# sourceMappingURL=graphqlSubscriptions.js.map