"use strict";
var getFromAST_1 = require("./getFromAST");
var cloneDeep = require("lodash/cloneDeep");
var TYPENAME_FIELD = {
    kind: 'Field',
    alias: null,
    name: {
        kind: 'Name',
        value: '__typename',
    },
};
function addTypenameToSelectionSet(selectionSet, isRoot) {
    if (isRoot === void 0) { isRoot = false; }
    if (selectionSet && selectionSet.selections) {
        if (!isRoot) {
            var alreadyHasThisField = selectionSet.selections.some(function (selection) {
                return selection.kind === 'Field' && selection.name.value === '__typename';
            });
            if (!alreadyHasThisField) {
                selectionSet.selections.push(TYPENAME_FIELD);
            }
        }
        selectionSet.selections.forEach(function (selection) {
            if (selection.kind === 'Field' || selection.kind === 'InlineFragment') {
                addTypenameToSelectionSet(selection.selectionSet);
            }
        });
    }
}
function addTypenameToDocument(doc) {
    getFromAST_1.checkDocument(doc);
    var docClone = cloneDeep(doc);
    docClone.definitions.forEach(function (definition) {
        var isRoot = definition.kind === 'OperationDefinition';
        addTypenameToSelectionSet(definition.selectionSet, isRoot);
    });
    return docClone;
}
exports.addTypenameToDocument = addTypenameToDocument;
//# sourceMappingURL=queryTransform.js.map