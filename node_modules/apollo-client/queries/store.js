"use strict";
var __assign = (this && this.__assign) || Object.assign || function(t) {
    for (var s, i = 1, n = arguments.length; i < n; i++) {
        s = arguments[i];
        for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
            t[p] = s[p];
    }
    return t;
};
var actions_1 = require("../actions");
var storeUtils_1 = require("../data/storeUtils");
var isEqual = require("lodash/isEqual");
var NetworkStatus;
(function (NetworkStatus) {
    NetworkStatus[NetworkStatus["loading"] = 1] = "loading";
    NetworkStatus[NetworkStatus["setVariables"] = 2] = "setVariables";
    NetworkStatus[NetworkStatus["fetchMore"] = 3] = "fetchMore";
    NetworkStatus[NetworkStatus["refetch"] = 4] = "refetch";
    NetworkStatus[NetworkStatus["poll"] = 6] = "poll";
    NetworkStatus[NetworkStatus["ready"] = 7] = "ready";
    NetworkStatus[NetworkStatus["error"] = 8] = "error";
})(NetworkStatus = exports.NetworkStatus || (exports.NetworkStatus = {}));
function queries(previousState, action) {
    if (previousState === void 0) { previousState = {}; }
    if (actions_1.isQueryInitAction(action)) {
        var newState = __assign({}, previousState);
        var previousQuery = previousState[action.queryId];
        if (previousQuery && previousQuery.queryString !== action.queryString) {
            throw new Error('Internal Error: may not update existing query string in store');
        }
        var isSetVariables = false;
        var previousVariables = void 0;
        if (action.storePreviousVariables &&
            previousQuery &&
            previousQuery.networkStatus !== NetworkStatus.loading) {
            if (!isEqual(previousQuery.variables, action.variables)) {
                isSetVariables = true;
                previousVariables = previousQuery.variables;
            }
        }
        var newNetworkStatus = NetworkStatus.loading;
        if (isSetVariables) {
            newNetworkStatus = NetworkStatus.setVariables;
        }
        else if (action.isPoll) {
            newNetworkStatus = NetworkStatus.poll;
        }
        else if (action.isRefetch) {
            newNetworkStatus = NetworkStatus.refetch;
        }
        else if (action.isPoll) {
            newNetworkStatus = NetworkStatus.poll;
        }
        newState[action.queryId] = {
            queryString: action.queryString,
            variables: action.variables,
            previousVariables: previousVariables,
            loading: true,
            networkError: null,
            graphQLErrors: null,
            networkStatus: newNetworkStatus,
            forceFetch: action.forceFetch,
            returnPartialData: action.returnPartialData,
            lastRequestId: action.requestId,
            metadata: action.metadata,
        };
        return newState;
    }
    else if (actions_1.isQueryResultAction(action)) {
        if (!previousState[action.queryId]) {
            return previousState;
        }
        if (action.requestId < previousState[action.queryId].lastRequestId) {
            return previousState;
        }
        var newState = __assign({}, previousState);
        var resultHasGraphQLErrors = storeUtils_1.graphQLResultHasError(action.result);
        newState[action.queryId] = __assign({}, previousState[action.queryId], { loading: false, networkError: null, graphQLErrors: resultHasGraphQLErrors ? action.result.errors : null, previousVariables: null, networkStatus: NetworkStatus.ready });
        return newState;
    }
    else if (actions_1.isQueryErrorAction(action)) {
        if (!previousState[action.queryId]) {
            return previousState;
        }
        if (action.requestId < previousState[action.queryId].lastRequestId) {
            return previousState;
        }
        var newState = __assign({}, previousState);
        newState[action.queryId] = __assign({}, previousState[action.queryId], { loading: false, networkError: action.error, networkStatus: NetworkStatus.error });
        return newState;
    }
    else if (actions_1.isQueryResultClientAction(action)) {
        if (!previousState[action.queryId]) {
            return previousState;
        }
        var newState = __assign({}, previousState);
        newState[action.queryId] = __assign({}, previousState[action.queryId], { loading: !action.complete, networkError: null, previousVariables: null, networkStatus: action.complete ? NetworkStatus.ready : NetworkStatus.loading });
        return newState;
    }
    else if (actions_1.isQueryStopAction(action)) {
        var newState = __assign({}, previousState);
        delete newState[action.queryId];
        return newState;
    }
    else if (actions_1.isStoreResetAction(action)) {
        return resetQueryState(previousState, action);
    }
    return previousState;
}
exports.queries = queries;
function resetQueryState(state, action) {
    var observableQueryIds = action.observableQueryIds;
    var newQueries = Object.keys(state).filter(function (queryId) {
        return (observableQueryIds.indexOf(queryId) > -1);
    }).reduce(function (res, key) {
        res[key] = __assign({}, state[key], { loading: true, networkStatus: NetworkStatus.loading });
        return res;
    }, {});
    return newQueries;
}
//# sourceMappingURL=store.js.map