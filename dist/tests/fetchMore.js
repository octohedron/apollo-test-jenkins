"use strict";
var lodash_1 = require('lodash');
var chai_1 = require('chai');
var graphql_tag_1 = require('graphql-tag');
var apollo_client_1 = require('apollo-client');
var getFromAST_1 = require('apollo-client/queries/getFromAST');
var index_1 = require('apollo-client/index');
var src_1 = require('../src');
describe('updateQuery on a simple query', function () {
    var query = (_a = ["\n    query thing {\n      entry {\n        value\n        __typename\n      }\n      __typename\n    }\n  "], _a.raw = ["\n    query thing {\n      entry {\n        value\n        __typename\n      }\n      __typename\n    }\n  "], graphql_tag_1.default(_a));
    var result = {
        data: {
            __typename: 'Query',
            entry: {
                __typename: 'Entry',
                value: 1,
            },
        },
    };
    it('triggers new result from updateQuery', function () {
        var latestResult = null;
        var networkInterface = src_1.mockNetworkInterface({
            request: { query: query },
            result: result,
        });
        var client = new apollo_client_1.default({
            networkInterface: networkInterface,
            addTypename: true,
        });
        var obsHandle = client.watchQuery({
            query: query,
        });
        var sub = obsHandle.subscribe({
            next: function (queryResult) {
                latestResult = queryResult;
            },
        });
        return new Promise(function (resolve) { return setTimeout(resolve); })
            .then(function () { return obsHandle; })
            .then(function (watchedQuery) {
            chai_1.assert.equal(latestResult.data.entry.value, 1);
            watchedQuery.updateQuery(function (prevResult) {
                var res = lodash_1.cloneDeep(prevResult);
                res.entry.value = 2;
                return res;
            });
            chai_1.assert.equal(latestResult.data.entry.value, 2);
        })
            .then(function () { return sub.unsubscribe(); });
    });
    var _a;
});
describe('fetchMore on an observable query', function () {
    var query = (_a = ["\n    query Comment($repoName: String!, $start: Int!, $limit: Int!) {\n      entry(repoFullName: $repoName) {\n        comments(start: $start, limit: $limit) {\n          text\n          __typename\n        }\n        __typename\n      }\n    }\n  "], _a.raw = ["\n    query Comment($repoName: String!, $start: Int!, $limit: Int!) {\n      entry(repoFullName: $repoName) {\n        comments(start: $start, limit: $limit) {\n          text\n          __typename\n        }\n        __typename\n      }\n    }\n  "], graphql_tag_1.default(_a));
    var query2 = (_b = ["\n    query NewComments($start: Int!, $limit: Int!) {\n      comments(start: $start, limit: $limit) {\n        text\n        __typename\n      }\n      __typename\n    }\n  "], _b.raw = ["\n    query NewComments($start: Int!, $limit: Int!) {\n      comments(start: $start, limit: $limit) {\n        text\n        __typename\n      }\n      __typename\n    }\n  "], graphql_tag_1.default(_b));
    var variables = {
        repoName: 'org/repo',
        start: 0,
        limit: 10,
    };
    var variablesMore = lodash_1.assign({}, variables, { start: 10, limit: 10 });
    var variables2 = {
        start: 10,
        limit: 20,
    };
    var result = {
        data: {
            __typename: 'Query',
            entry: {
                __typename: 'Entry',
                comments: [],
            },
        },
    };
    var resultMore = lodash_1.cloneDeep(result);
    var result2 = {
        data: {
            __typename: 'Query',
            comments: [],
        },
    };
    for (var i = 1; i <= 10; i++) {
        result.data.entry.comments.push({ text: "comment " + i, __typename: 'Comment' });
    }
    for (var i = 11; i <= 20; i++) {
        resultMore.data.entry.comments.push({ text: "comment " + i, __typename: 'Comment' });
        result2.data.comments.push({ text: "new comment " + i, __typename: 'Comment' });
    }
    var latestResult = null;
    var client;
    var networkInterface;
    var sub;
    function setup() {
        var mockedResponses = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            mockedResponses[_i - 0] = arguments[_i];
        }
        networkInterface = src_1.mockNetworkInterface.apply(void 0, [{
            request: {
                query: query,
                variables: variables,
            },
            result: result,
        }].concat(mockedResponses));
        client = new apollo_client_1.default({
            networkInterface: networkInterface,
            addTypename: true,
        });
        var obsHandle = client.watchQuery({
            query: query,
            variables: variables,
        });
        sub = obsHandle.subscribe({
            next: function (queryResult) {
                latestResult = queryResult;
            },
        });
        return Promise.resolve(obsHandle);
    }
    ;
    function unsetup() {
        sub.unsubscribe();
        sub = null;
    }
    it('basic fetchMore results merging', function () {
        latestResult = null;
        return setup({
            request: {
                query: query,
                variables: variablesMore,
            },
            result: resultMore,
        }).then(function (watchedQuery) {
            return watchedQuery.fetchMore({
                variables: { start: 10 },
                updateQuery: function (prev, options) {
                    var state = lodash_1.cloneDeep(prev);
                    state.entry.comments = state.entry.comments.concat(options.fetchMoreResult.data.entry.comments);
                    return state;
                },
            });
        }).then(function (data) {
            chai_1.assert.lengthOf(data.data.entry.comments, 10);
            chai_1.assert.isFalse(data.loading);
            var comments = latestResult.data.entry.comments;
            chai_1.assert.lengthOf(comments, 20);
            for (var i = 1; i <= 20; i++) {
                chai_1.assert.equal(comments[i - 1].text, "comment " + i);
            }
            unsetup();
        });
    });
    it('fetching more with a different query', function () {
        latestResult = null;
        return setup({
            request: {
                query: query2,
                variables: variables2,
            },
            result: result2,
        }).then(function (watchedQuery) {
            return watchedQuery.fetchMore({
                query: query2,
                variables: variables2,
                updateQuery: function (prev, options) {
                    var state = lodash_1.cloneDeep(prev);
                    state.entry.comments = state.entry.comments.concat(options.fetchMoreResult.data.comments);
                    return state;
                },
            });
        }).then(function () {
            var comments = latestResult.data.entry.comments;
            chai_1.assert.lengthOf(comments, 20);
            for (var i = 1; i <= 10; i++) {
                chai_1.assert.equal(comments[i - 1].text, "comment " + i);
            }
            for (var i = 11; i <= 20; i++) {
                chai_1.assert.equal(comments[i - 1].text, "new comment " + i);
            }
            unsetup();
        });
    });
    it('fetching more with fragments', function () {
        latestResult = null;
        var query3 = (_a = ["\n      query NewComments($start: Int!, $limit: Int!) {\n        comments(start: $start, limit: $limit) {\n          ...textFragment\n          __typename\n        }\n      }\n    "], _a.raw = ["\n      query NewComments($start: Int!, $limit: Int!) {\n        comments(start: $start, limit: $limit) {\n          ...textFragment\n          __typename\n        }\n      }\n    "], graphql_tag_1.default(_a));
        var fragment = index_1.createFragment((_b = ["\n      fragment textFragment on Comment {\n        text\n        __typename\n      }\n    "], _b.raw = ["\n      fragment textFragment on Comment {\n        text\n        __typename\n      }\n    "], graphql_tag_1.default(_b)));
        return setup({
            request: {
                query: getFromAST_1.addFragmentsToDocument(query3, fragment),
                variables: variables2,
            },
            result: result2,
        }).then(function (watchedQuery) {
            return watchedQuery.fetchMore({
                query: query3,
                variables: variables2,
                fragments: fragment,
                updateQuery: function (prev, options) {
                    var state = lodash_1.cloneDeep(prev);
                    state.entry.comments = state.entry.comments.concat(options.fetchMoreResult.data.comments);
                    return state;
                },
            });
        }).then(function () {
            var comments = latestResult.data.entry.comments;
            chai_1.assert.lengthOf(comments, 20);
            for (var i = 1; i <= 10; i++) {
                chai_1.assert.equal(comments[i - 1].text, "comment " + i);
            }
            for (var i = 11; i <= 20; i++) {
                chai_1.assert.equal(comments[i - 1].text, "new comment " + i);
            }
            unsetup();
        });
        var _a, _b;
    });
    var _a, _b;
});
//# sourceMappingURL=fetchMore.js.map