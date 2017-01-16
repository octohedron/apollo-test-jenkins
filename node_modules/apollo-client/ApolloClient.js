"use strict";
var __assign = (this && this.__assign) || Object.assign || function(t) {
    for (var s, i = 1, n = arguments.length; i < n; i++) {
        s = arguments[i];
        for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
            t[p] = s[p];
    }
    return t;
};
var networkInterface_1 = require("./transport/networkInterface");
var isUndefined = require("lodash/isUndefined");
var isString = require("lodash/isString");
var store_1 = require("./store");
var QueryManager_1 = require("./core/QueryManager");
var storeUtils_1 = require("./data/storeUtils");
var fragments_1 = require("./fragments");
var getFromAST_1 = require("./queries/getFromAST");
var version_1 = require("./version");
var DEFAULT_REDUX_ROOT_KEY = 'apollo';
function defaultReduxRootSelector(state) {
    return state[DEFAULT_REDUX_ROOT_KEY];
}
var haveWarnedQuery = false;
var haveWarnedWatchQuery = false;
var haveWarnedMutation = false;
var haveWarnedSubscription = false;
var ApolloClient = (function () {
    function ApolloClient(_a) {
        var _b = _a === void 0 ? {} : _a, networkInterface = _b.networkInterface, reduxRootKey = _b.reduxRootKey, reduxRootSelector = _b.reduxRootSelector, initialState = _b.initialState, dataIdFromObject = _b.dataIdFromObject, resultComparator = _b.resultComparator, _c = _b.ssrMode, ssrMode = _c === void 0 ? false : _c, _d = _b.ssrForceFetchDelay, ssrForceFetchDelay = _d === void 0 ? 0 : _d, _e = _b.mutationBehaviorReducers, mutationBehaviorReducers = _e === void 0 ? {} : _e, _f = _b.addTypename, addTypename = _f === void 0 ? true : _f, resultTransformer = _b.resultTransformer, customResolvers = _b.customResolvers, connectToDevTools = _b.connectToDevTools, _g = _b.queryDeduplication, queryDeduplication = _g === void 0 ? false : _g;
        var _this = this;
        this.middleware = function () {
            return function (store) {
                _this.setStore(store);
                return function (next) { return function (action) {
                    var returnValue = next(action);
                    _this.queryManager.broadcastNewStore(store.getState());
                    if (_this.devToolsHookCb) {
                        _this.devToolsHookCb({
                            action: action,
                            state: _this.queryManager.getApolloState(),
                            dataWithOptimisticResults: _this.queryManager.getDataWithOptimisticResults(),
                        });
                    }
                    return returnValue;
                }; };
            };
        };
        if (reduxRootKey && reduxRootSelector) {
            throw new Error('Both "reduxRootKey" and "reduxRootSelector" are configured, but only one of two is allowed.');
        }
        if (reduxRootKey) {
            console.warn('"reduxRootKey" option is deprecated and might be removed in the upcoming versions, ' +
                'please use the "reduxRootSelector" instead.');
            this.reduxRootKey = reduxRootKey;
        }
        if (!reduxRootSelector && reduxRootKey) {
            this.reduxRootSelector = function (state) { return state[reduxRootKey]; };
        }
        else if (isString(reduxRootSelector)) {
            this.reduxRootKey = reduxRootSelector;
            this.reduxRootSelector = function (state) { return state[reduxRootSelector]; };
        }
        else if (typeof reduxRootSelector === 'function') {
            this.reduxRootSelector = reduxRootSelector;
        }
        else {
            this.reduxRootSelector = null;
        }
        this.initialState = initialState ? initialState : {};
        this.networkInterface = networkInterface ? networkInterface :
            networkInterface_1.createNetworkInterface({ uri: '/graphql' });
        this.addTypename = addTypename;
        this.resultTransformer = resultTransformer;
        this.resultComparator = resultComparator;
        this.shouldForceFetch = !(ssrMode || ssrForceFetchDelay > 0);
        this.dataId = dataIdFromObject;
        this.fieldWithArgs = storeUtils_1.storeKeyNameFromFieldNameAndArgs;
        this.queryDeduplication = queryDeduplication;
        if (ssrForceFetchDelay) {
            setTimeout(function () { return _this.shouldForceFetch = true; }, ssrForceFetchDelay);
        }
        this.reducerConfig = {
            dataIdFromObject: dataIdFromObject,
            mutationBehaviorReducers: mutationBehaviorReducers,
            customResolvers: customResolvers,
        };
        this.watchQuery = this.watchQuery.bind(this);
        this.query = this.query.bind(this);
        this.mutate = this.mutate.bind(this);
        this.setStore = this.setStore.bind(this);
        this.resetStore = this.resetStore.bind(this);
        var defaultConnectToDevTools = typeof process === 'undefined' || (process.env && process.env.NODE_ENV !== 'production') &&
            typeof window !== 'undefined' && (!window.__APOLLO_CLIENT__);
        if (typeof connectToDevTools === 'undefined') {
            connectToDevTools = defaultConnectToDevTools;
        }
        if (connectToDevTools) {
            window.__APOLLO_CLIENT__ = this;
        }
        this.version = version_1.version;
    }
    ApolloClient.prototype.watchQuery = function (options) {
        this.initStore();
        if (!this.shouldForceFetch && options.forceFetch) {
            options = __assign({}, options, { forceFetch: false });
        }
        if (options.fragments && !haveWarnedWatchQuery && process.env.NODE_ENV !== 'production') {
            console.warn('"fragments" option is deprecated and will be removed in the upcoming versions, ' +
                'please refer to the documentation for how to define fragments: ' +
                'http://dev.apollodata.com/react/fragments.html.');
            if (process.env.NODE_ENV !== 'test') {
                haveWarnedWatchQuery = true;
            }
        }
        fragments_1.createFragment(options.query, undefined, true);
        var fullDocument = getFromAST_1.addFragmentsToDocument(options.query, options.fragments);
        var realOptions = __assign({}, options, { query: fullDocument });
        delete realOptions.fragments;
        return this.queryManager.watchQuery(realOptions);
    };
    ;
    ApolloClient.prototype.query = function (options) {
        this.initStore();
        if (!this.shouldForceFetch && options.forceFetch) {
            options = __assign({}, options, { forceFetch: false });
        }
        if (options.fragments && !haveWarnedQuery && process.env.NODE_ENV !== 'production') {
            console.warn('"fragments" option is deprecated and will be removed in the upcoming versions, ' +
                'please refer to the documentation for how to define fragments: ' +
                'http://dev.apollodata.com/react/fragments.html.');
            if (process.env.NODE_ENV !== 'test') {
                haveWarnedQuery = true;
            }
        }
        fragments_1.createFragment(options.query, undefined, true);
        var fullDocument = getFromAST_1.addFragmentsToDocument(options.query, options.fragments);
        var realOptions = __assign({}, options, { query: fullDocument });
        delete realOptions.fragments;
        return this.queryManager.query(realOptions);
    };
    ;
    ApolloClient.prototype.mutate = function (options) {
        this.initStore();
        if (options.fragments && !haveWarnedMutation && process.env.NODE_ENV !== 'production') {
            console.warn('"fragments" option is deprecated and will be removed in the upcoming versions, ' +
                'please refer to the documentation for how to define fragments: ' +
                'http://dev.apollodata.com/react/fragments.html.');
            if (process.env.NODE_ENV !== 'test') {
                haveWarnedMutation = true;
            }
        }
        var fullDocument = getFromAST_1.addFragmentsToDocument(options.mutation, options.fragments);
        var realOptions = __assign({}, options, { mutation: fullDocument });
        delete realOptions.fragments;
        return this.queryManager.mutate(realOptions);
    };
    ;
    ApolloClient.prototype.subscribe = function (options) {
        this.initStore();
        if (options.fragments && !haveWarnedSubscription && process.env.NODE_ENV !== 'production') {
            console.warn('"fragments" option is deprecated and will be removed in the upcoming versions, ' +
                'please refer to the documentation for how to define fragments: ' +
                'http://dev.apollodata.com/react/fragments.html.');
            if (process.env.NODE_ENV !== 'test') {
                haveWarnedSubscription = true;
            }
        }
        var fullDocument = getFromAST_1.addFragmentsToDocument(options.query, options.fragments);
        var realOptions = __assign({}, options, { document: fullDocument });
        delete realOptions.fragments;
        delete realOptions.query;
        return this.queryManager.startGraphQLSubscription(realOptions);
    };
    ApolloClient.prototype.reducer = function () {
        return store_1.createApolloReducer(this.reducerConfig);
    };
    ApolloClient.prototype.__actionHookForDevTools = function (cb) {
        this.devToolsHookCb = cb;
    };
    ApolloClient.prototype.initStore = function () {
        var _this = this;
        if (this.store) {
            return;
        }
        if (this.reduxRootSelector) {
            throw new Error('Cannot initialize the store because "reduxRootSelector" or "reduxRootKey" is provided. ' +
                'They should only be used when the store is created outside of the client. ' +
                'This may lead to unexpected results when querying the store internally. ' +
                "Please remove that option from ApolloClient constructor.");
        }
        this.setStore(store_1.createApolloStore({
            reduxRootKey: DEFAULT_REDUX_ROOT_KEY,
            initialState: this.initialState,
            config: this.reducerConfig,
            logger: function (store) { return function (next) { return function (action) {
                var result = next(action);
                if (_this.devToolsHookCb) {
                    _this.devToolsHookCb({
                        action: action,
                        state: _this.queryManager.getApolloState(),
                        dataWithOptimisticResults: _this.queryManager.getDataWithOptimisticResults(),
                    });
                }
                return result;
            }; }; },
        }));
        this.reduxRootKey = DEFAULT_REDUX_ROOT_KEY;
    };
    ;
    ApolloClient.prototype.resetStore = function () {
        this.queryManager.resetStore();
    };
    ;
    ApolloClient.prototype.getInitialState = function () {
        return this.queryManager.getInitialState();
    };
    ApolloClient.prototype.setStore = function (store) {
        var reduxRootSelector;
        if (this.reduxRootSelector) {
            reduxRootSelector = this.reduxRootSelector;
        }
        else {
            reduxRootSelector = defaultReduxRootSelector;
            this.reduxRootKey = DEFAULT_REDUX_ROOT_KEY;
        }
        if (isUndefined(reduxRootSelector(store.getState()))) {
            throw new Error('Existing store does not use apolloReducer. Please make sure the store ' +
                'is properly configured and "reduxRootSelector" is correctly specified.');
        }
        this.store = store;
        this.queryManager = new QueryManager_1.QueryManager({
            networkInterface: this.networkInterface,
            reduxRootSelector: reduxRootSelector,
            store: store,
            addTypename: this.addTypename,
            resultTransformer: this.resultTransformer,
            resultComparator: this.resultComparator,
            reducerConfig: this.reducerConfig,
            queryDeduplication: this.queryDeduplication,
        });
    };
    ;
    return ApolloClient;
}());
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = ApolloClient;
//# sourceMappingURL=ApolloClient.js.map