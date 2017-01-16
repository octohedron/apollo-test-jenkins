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
var writeToStore_1 = require("./writeToStore");
var storeUtils_1 = require("./storeUtils");
var mutationResults_1 = require("./mutationResults");
var replaceQueryResults_1 = require("./replaceQueryResults");
function data(previousState, action, queries, mutations, config) {
    if (previousState === void 0) { previousState = {}; }
    var constAction = action;
    if (actions_1.isQueryResultAction(action)) {
        if (!queries[action.queryId]) {
            return previousState;
        }
        if (action.requestId < queries[action.queryId].lastRequestId) {
            return previousState;
        }
        if (!storeUtils_1.graphQLResultHasError(action.result)) {
            var queryStoreValue = queries[action.queryId];
            var clonedState = __assign({}, previousState);
            var newState_1 = writeToStore_1.writeResultToStore({
                result: action.result.data,
                dataId: 'ROOT_QUERY',
                document: action.document,
                variables: queryStoreValue.variables,
                store: clonedState,
                dataIdFromObject: config.dataIdFromObject,
            });
            if (action.extraReducers) {
                action.extraReducers.forEach(function (reducer) {
                    newState_1 = reducer(newState_1, constAction);
                });
            }
            return newState_1;
        }
    }
    else if (actions_1.isSubscriptionResultAction(action)) {
        if (!storeUtils_1.graphQLResultHasError(action.result)) {
            var clonedState = __assign({}, previousState);
            var newState_2 = writeToStore_1.writeResultToStore({
                result: action.result.data,
                dataId: 'ROOT_QUERY',
                document: action.document,
                variables: action.variables,
                store: clonedState,
                dataIdFromObject: config.dataIdFromObject,
            });
            if (action.extraReducers) {
                action.extraReducers.forEach(function (reducer) {
                    newState_2 = reducer(newState_2, constAction);
                });
            }
            return newState_2;
        }
    }
    else if (actions_1.isMutationResultAction(constAction)) {
        if (!constAction.result.errors) {
            var queryStoreValue_1 = mutations[constAction.mutationId];
            var clonedState = __assign({}, previousState);
            var newState_3 = writeToStore_1.writeResultToStore({
                result: constAction.result.data,
                dataId: 'ROOT_MUTATION',
                document: constAction.document,
                variables: queryStoreValue_1.variables,
                store: clonedState,
                dataIdFromObject: config.dataIdFromObject,
            });
            if (constAction.resultBehaviors) {
                constAction.resultBehaviors.forEach(function (behavior) {
                    var args = {
                        behavior: behavior,
                        result: constAction.result,
                        variables: queryStoreValue_1.variables,
                        document: constAction.document,
                        config: config,
                    };
                    if (mutationResults_1.defaultMutationBehaviorReducers[behavior.type]) {
                        newState_3 = mutationResults_1.defaultMutationBehaviorReducers[behavior.type](newState_3, args);
                    }
                    else if (config.mutationBehaviorReducers[behavior.type]) {
                        newState_3 = config.mutationBehaviorReducers[behavior.type](newState_3, args);
                    }
                    else {
                        throw new Error("No mutation result reducer defined for type " + behavior.type);
                    }
                });
            }
            if (constAction.extraReducers) {
                constAction.extraReducers.forEach(function (reducer) {
                    newState_3 = reducer(newState_3, constAction);
                });
            }
            return newState_3;
        }
    }
    else if (actions_1.isUpdateQueryResultAction(constAction)) {
        return replaceQueryResults_1.replaceQueryResults(previousState, constAction, config);
    }
    else if (actions_1.isStoreResetAction(action)) {
        return {};
    }
    return previousState;
}
exports.data = data;
//# sourceMappingURL=store.js.map