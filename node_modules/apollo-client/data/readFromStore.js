"use strict";
var graphql_anywhere_1 = require("graphql-anywhere");
var storeUtils_1 = require("./storeUtils");
var storeUtils_2 = require("./storeUtils");
var getFromAST_1 = require("../queries/getFromAST");
function readQueryFromStore(_a) {
    var store = _a.store, query = _a.query, variables = _a.variables, _b = _a.returnPartialData, returnPartialData = _b === void 0 ? false : _b, config = _a.config;
    var result = diffQueryAgainstStore({
        query: query,
        store: store,
        returnPartialData: returnPartialData,
        variables: variables,
        config: config,
    }).result;
    return result;
}
exports.readQueryFromStore = readQueryFromStore;
var haveWarned = false;
var fragmentMatcher = function (idValue, typeCondition, context) {
    assertIdValue(idValue);
    var obj = context.store[idValue.id];
    if (!obj) {
        return false;
    }
    if (!obj.__typename) {
        if (!haveWarned) {
            console.warn("You're using fragments in your queries, but don't have the addTypename:\ntrue option set in Apollo Client. Please turn on that option so that we can accurately\nmatch fragments.");
            if (process.env.NODE_ENV !== 'test') {
                haveWarned = true;
            }
        }
        context.returnPartialData = true;
        return true;
    }
    if (obj.__typename === typeCondition) {
        return true;
    }
    context.returnPartialData = true;
    return true;
};
var readStoreResolver = function (fieldName, idValue, args, context) {
    assertIdValue(idValue);
    var objId = idValue.id;
    var obj = context.store[objId];
    var storeKeyName = storeUtils_2.storeKeyNameFromFieldNameAndArgs(fieldName, args);
    var fieldValue = (obj || {})[storeKeyName];
    if (typeof fieldValue === 'undefined') {
        if (context.customResolvers && obj && (obj.__typename || objId === 'ROOT_QUERY')) {
            var typename = obj.__typename || 'Query';
            var type = context.customResolvers[typename];
            if (type) {
                var resolver = type[fieldName];
                if (resolver) {
                    return resolver(obj, args);
                }
            }
        }
        if (!context.returnPartialData) {
            throw new Error("Can't find field " + storeKeyName + " on object (" + objId + ") " + JSON.stringify(obj, null, 2) + ".\nPerhaps you want to use the `returnPartialData` option?");
        }
        context.hasMissingField = true;
        return fieldValue;
    }
    if (storeUtils_1.isJsonValue(fieldValue)) {
        return fieldValue.json;
    }
    return fieldValue;
};
function diffQueryAgainstStore(_a) {
    var store = _a.store, query = _a.query, variables = _a.variables, _b = _a.returnPartialData, returnPartialData = _b === void 0 ? true : _b, config = _a.config;
    getFromAST_1.getQueryDefinition(query);
    var context = {
        store: store,
        returnPartialData: returnPartialData,
        customResolvers: config && config.customResolvers,
        hasMissingField: false,
    };
    var rootIdValue = {
        type: 'id',
        id: 'ROOT_QUERY',
    };
    var result = graphql_anywhere_1.default(readStoreResolver, query, rootIdValue, context, variables, {
        fragmentMatcher: fragmentMatcher,
    });
    return {
        result: result,
        isMissing: context.hasMissingField,
    };
}
exports.diffQueryAgainstStore = diffQueryAgainstStore;
function assertIdValue(idValue) {
    if (!storeUtils_1.isIdValue(idValue)) {
        throw new Error("Encountered a sub-selection on the query, but the store doesn't have an object reference. This should never happen during normal use unless you have custom code that is directly manipulating the store; please file an issue.");
    }
}
//# sourceMappingURL=readFromStore.js.map