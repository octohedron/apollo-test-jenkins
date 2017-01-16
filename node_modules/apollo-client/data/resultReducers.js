"use strict";
var readFromStore_1 = require("./readFromStore");
var writeToStore_1 = require("./writeToStore");
function createStoreReducer(resultReducer, document, variables, config) {
    return function (store, action) {
        var currentResult = readFromStore_1.readQueryFromStore({
            store: store,
            query: document,
            variables: variables,
            returnPartialData: true,
            config: config,
        });
        var nextResult = resultReducer(currentResult, action, variables);
        if (currentResult !== nextResult) {
            return writeToStore_1.writeResultToStore({
                dataId: 'ROOT_QUERY',
                result: nextResult,
                store: store,
                document: document,
                variables: variables,
                dataIdFromObject: config.dataIdFromObject,
            });
        }
        return store;
    };
}
exports.createStoreReducer = createStoreReducer;
//# sourceMappingURL=resultReducers.js.map