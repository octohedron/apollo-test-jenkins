"use strict";
var __assign = (this && this.__assign) || Object.assign || function(t) {
    for (var s, i = 1, n = arguments.length; i < n; i++) {
        s = arguments[i];
        for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
            t[p] = s[p];
    }
    return t;
};
var mapValues = require("lodash/mapValues");
var cloneDeep = require("lodash/cloneDeep");
var replaceQueryResults_1 = require("./replaceQueryResults");
var writeToStore_1 = require("./writeToStore");
var getFromAST_1 = require("../queries/getFromAST");
var scopeQuery_1 = require("./scopeQuery");
function mutationResultArrayInsertReducer(state, _a) {
    var behavior = _a.behavior, result = _a.result, variables = _a.variables, document = _a.document, config = _a.config;
    var _b = behavior, resultPath = _b.resultPath, storePath = _b.storePath, where = _b.where;
    var selectionSet = getFromAST_1.getOperationDefinition(document).selectionSet;
    var fragmentMap = getFromAST_1.createFragmentMap(getFromAST_1.getFragmentDefinitions(document));
    var scopedSelectionSet = scopeQuery_1.scopeSelectionSetToResultPath({
        selectionSet: selectionSet,
        fragmentMap: fragmentMap,
        path: resultPath,
    });
    var scopedResult = scopeQuery_1.scopeJSONToResultPath({
        json: result.data,
        path: resultPath,
    });
    var dataId = config.dataIdFromObject(scopedResult) || generateMutationResultDataId();
    state = writeToStore_1.writeSelectionSetToStore({
        result: scopedResult,
        dataId: dataId,
        selectionSet: scopedSelectionSet,
        context: {
            store: state,
            variables: variables,
            dataIdFromObject: config.dataIdFromObject,
            fragmentMap: fragmentMap,
        },
    });
    var dataIdOfObj = storePath[0], restStorePath = storePath.slice(1);
    var clonedObj = cloneDeep(state[dataIdOfObj]);
    var array = scopeQuery_1.scopeJSONToResultPath({
        json: clonedObj,
        path: restStorePath,
    });
    var idValue = { type: 'id', generated: false, id: dataId };
    if (where === 'PREPEND') {
        array.unshift(idValue);
    }
    else if (where === 'APPEND') {
        array.push(idValue);
    }
    else {
        throw new Error('Unsupported "where" option to ARRAY_INSERT.');
    }
    return __assign({}, state, (_c = {}, _c[dataIdOfObj] = clonedObj, _c));
    var _c;
}
var currId = 0;
function generateMutationResultDataId() {
    currId++;
    return "ARRAY_INSERT-gen-id-" + currId;
}
function mutationResultDeleteReducer(state, _a) {
    var behavior = _a.behavior;
    var dataId = behavior.dataId;
    delete state[dataId];
    var newState = mapValues(state, function (storeObj) {
        return removeRefsFromStoreObj(storeObj, dataId);
    });
    return newState;
}
function removeRefsFromStoreObj(storeObj, dataId) {
    var affected = false;
    var cleanedObj = mapValues(storeObj, function (value) {
        if (value && value.id === dataId) {
            affected = true;
            return null;
        }
        if (Array.isArray(value)) {
            var filteredArray = cleanArray(value, dataId);
            if (filteredArray !== value) {
                affected = true;
                return filteredArray;
            }
        }
        return value;
    });
    if (affected) {
        return cleanedObj;
    }
    else {
        return storeObj;
    }
}
function cleanArray(originalArray, dataId) {
    if (originalArray.length && Array.isArray(originalArray[0])) {
        var modified_1 = false;
        var filteredArray = originalArray.map(function (nestedArray) {
            var nestedFilteredArray = cleanArray(nestedArray, dataId);
            if (nestedFilteredArray !== nestedArray) {
                modified_1 = true;
                return nestedFilteredArray;
            }
            return nestedArray;
        });
        if (!modified_1) {
            return originalArray;
        }
        return filteredArray;
    }
    else {
        var filteredArray = originalArray.filter(function (item) { return item.id !== dataId; });
        if (filteredArray.length === originalArray.length) {
            return originalArray;
        }
        return filteredArray;
    }
}
exports.cleanArray = cleanArray;
function mutationResultArrayDeleteReducer(state, _a) {
    var behavior = _a.behavior;
    var _b = behavior, dataId = _b.dataId, storePath = _b.storePath;
    var dataIdOfObj = storePath[0], restStorePath = storePath.slice(1);
    var clonedObj = cloneDeep(state[dataIdOfObj]);
    var array = scopeQuery_1.scopeJSONToResultPath({
        json: clonedObj,
        path: restStorePath,
    });
    var index = -1;
    array.some(function (item, i) {
        if (item && item.id === dataId) {
            index = i;
            return true;
        }
        return false;
    });
    if (index === -1) {
        return state;
    }
    array.splice(index, 1);
    return __assign({}, state, (_c = {}, _c[dataIdOfObj] = clonedObj, _c));
    var _c;
}
function mutationResultQueryResultReducer(state, _a) {
    var behavior = _a.behavior, config = _a.config;
    return replaceQueryResults_1.replaceQueryResults(state, behavior, config);
}
exports.mutationResultQueryResultReducer = mutationResultQueryResultReducer;
exports.defaultMutationBehaviorReducers = {
    'ARRAY_INSERT': mutationResultArrayInsertReducer,
    'DELETE': mutationResultDeleteReducer,
    'ARRAY_DELETE': mutationResultArrayDeleteReducer,
    'QUERY_RESULT': mutationResultQueryResultReducer,
};
//# sourceMappingURL=mutationResults.js.map