"use strict";
var flatten = require("lodash/flatten");
var getFromAST_1 = require("./queries/getFromAST");
exports.fragmentDefinitionsMap = {};
var printFragmentWarnings = true;
var haveWarned = false;
function createFragment(doc, fragments, internalUse) {
    if (fragments === void 0) { fragments = []; }
    if (internalUse === void 0) { internalUse = false; }
    if (!internalUse) {
        if (!haveWarned) {
            if (process.env.NODE_ENV !== 'production') {
                console.warn('"createFragment" is deprecated and will be removed in version 0.6, ' +
                    'please refer to the documentation for how to define fragments: ' +
                    'http://dev.apollodata.com/react/fragments.html.');
            }
            if (process.env.NODE_ENV !== 'test') {
                haveWarned = true;
            }
        }
    }
    fragments = flatten(fragments);
    var fragmentDefinitions = getFromAST_1.getFragmentDefinitions(doc);
    fragmentDefinitions.forEach(function (fragmentDefinition) {
        var fragmentName = fragmentDefinition.name.value;
        if (exports.fragmentDefinitionsMap.hasOwnProperty(fragmentName) &&
            exports.fragmentDefinitionsMap[fragmentName].indexOf(fragmentDefinition) === -1) {
            if (printFragmentWarnings) {
                console.warn("Warning: fragment with name " + fragmentDefinition.name.value + " already exists.\nApollo Client enforces all fragment names across your application to be unique; read more about\nthis in the docs: http://docs.apollostack.com/");
            }
            exports.fragmentDefinitionsMap[fragmentName].push(fragmentDefinition);
        }
        else if (!exports.fragmentDefinitionsMap.hasOwnProperty(fragmentName)) {
            exports.fragmentDefinitionsMap[fragmentName] = [fragmentDefinition];
        }
    });
    return fragments.concat(fragmentDefinitions);
}
exports.createFragment = createFragment;
function disableFragmentWarnings() {
    printFragmentWarnings = false;
}
exports.disableFragmentWarnings = disableFragmentWarnings;
function enableFragmentWarnings() {
    printFragmentWarnings = true;
}
exports.enableFragmentWarnings = enableFragmentWarnings;
function clearFragmentDefinitions() {
    exports.fragmentDefinitionsMap = {};
}
exports.clearFragmentDefinitions = clearFragmentDefinitions;
//# sourceMappingURL=fragments.js.map