"use strict";
var chai_1 = require('chai');
var graphql_tag_1 = require('graphql-tag');
var apollo_client_1 = require('apollo-client');
var store_1 = require('apollo-client/queries/store');
var src_1 = require('../src');
describe('custom resolvers', function () {
    it("works for cache redirection", function () {
        var dataIdFromObject = function (obj) {
            return obj.id;
        };
        var listQuery = (_a = ["{ people { id name } }"], _a.raw = ["{ people { id name } }"], graphql_tag_1.default(_a));
        var listData = {
            people: [
                {
                    id: '4',
                    name: 'Luke Skywalker',
                    __typename: 'Person',
                },
            ],
        };
        var netListQuery = (_b = ["{ people { id name __typename } }"], _b.raw = ["{ people { id name __typename } }"], graphql_tag_1.default(_b));
        var itemQuery = (_c = ["{ person(id: 4) { id name } }"], _c.raw = ["{ person(id: 4) { id name } }"], graphql_tag_1.default(_c));
        var networkInterface = src_1.mockNetworkInterface({
            request: { query: netListQuery },
            result: { data: listData },
        });
        var client = new apollo_client_1.default({
            networkInterface: networkInterface,
            customResolvers: {
                Query: {
                    person: function (_, args) { return apollo_client_1.toIdValue(args['id']); },
                },
            },
            dataIdFromObject: dataIdFromObject,
        });
        return client.query({ query: listQuery }).then(function () {
            return client.query({ query: itemQuery });
        }).then(function (itemResult) {
            chai_1.assert.deepEqual(itemResult, {
                loading: false,
                networkStatus: store_1.NetworkStatus.ready,
                data: {
                    person: {
                        __typename: 'Person',
                        id: '4',
                        name: 'Luke Skywalker',
                    },
                },
            });
        });
        var _a, _b, _c;
    });
});
//# sourceMappingURL=customResolvers.js.map