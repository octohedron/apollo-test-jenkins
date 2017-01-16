"use strict";
var isString = require("lodash/isString");
var assign = require("lodash/assign");
var mapValues = require("lodash/mapValues");
require("whatwg-fetch");
var printer_1 = require("graphql-tag/printer");
function printRequest(request) {
    return mapValues(request, function (val, key) {
        return key === 'query' ? printer_1.print(val) : val;
    });
}
exports.printRequest = printRequest;
var HTTPFetchNetworkInterface = (function () {
    function HTTPFetchNetworkInterface(uri, opts) {
        if (opts === void 0) { opts = {}; }
        if (!uri) {
            throw new Error('A remote enpdoint is required for a network layer');
        }
        if (!isString(uri)) {
            throw new Error('Remote endpoint must be a string');
        }
        this._uri = uri;
        this._opts = assign({}, opts);
        this._middlewares = [];
        this._afterwares = [];
    }
    HTTPFetchNetworkInterface.prototype.applyMiddlewares = function (_a) {
        var _this = this;
        var request = _a.request, options = _a.options;
        return new Promise(function (resolve, reject) {
            var queue = function (funcs, scope) {
                var next = function () {
                    if (funcs.length > 0) {
                        var f = funcs.shift();
                        f.applyMiddleware.apply(scope, [{ request: request, options: options }, next]);
                    }
                    else {
                        resolve({
                            request: request,
                            options: options,
                        });
                    }
                };
                next();
            };
            queue(_this._middlewares.slice(), _this);
        });
    };
    HTTPFetchNetworkInterface.prototype.applyAfterwares = function (_a) {
        var _this = this;
        var response = _a.response, options = _a.options;
        return new Promise(function (resolve, reject) {
            var queue = function (funcs, scope) {
                var next = function () {
                    if (funcs.length > 0) {
                        var f = funcs.shift();
                        f.applyAfterware.apply(scope, [{ response: response, options: options }, next]);
                    }
                    else {
                        resolve({
                            response: response,
                            options: options,
                        });
                    }
                };
                next();
            };
            queue(_this._afterwares.slice(), _this);
        });
    };
    HTTPFetchNetworkInterface.prototype.fetchFromRemoteEndpoint = function (_a) {
        var request = _a.request, options = _a.options;
        return fetch(this._uri, assign({}, this._opts, {
            body: JSON.stringify(printRequest(request)),
            method: 'POST',
        }, options, {
            headers: assign({}, {
                Accept: '*/*',
                'Content-Type': 'application/json',
            }, options.headers),
        }));
    };
    ;
    HTTPFetchNetworkInterface.prototype.query = function (request) {
        var _this = this;
        var options = assign({}, this._opts);
        return this.applyMiddlewares({
            request: request,
            options: options,
        }).then(function (rao) { return _this.fetchFromRemoteEndpoint.call(_this, rao); })
            .then(function (response) { return _this.applyAfterwares({
            response: response,
            options: options,
        }); })
            .then(function (_a) {
            var response = _a.response;
            return response.json();
        })
            .then(function (payload) {
            if (!payload.hasOwnProperty('data') && !payload.hasOwnProperty('errors')) {
                throw new Error("Server response was missing for query '" + request.debugName + "'.");
            }
            else {
                return payload;
            }
        });
    };
    ;
    HTTPFetchNetworkInterface.prototype.use = function (middlewares) {
        var _this = this;
        middlewares.map(function (middleware) {
            if (typeof middleware.applyMiddleware === 'function') {
                _this._middlewares.push(middleware);
            }
            else {
                throw new Error('Middleware must implement the applyMiddleware function');
            }
        });
        return this;
    };
    HTTPFetchNetworkInterface.prototype.useAfter = function (afterwares) {
        var _this = this;
        afterwares.map(function (afterware) {
            if (typeof afterware.applyAfterware === 'function') {
                _this._afterwares.push(afterware);
            }
            else {
                throw new Error('Afterware must implement the applyAfterware function');
            }
        });
        return this;
    };
    return HTTPFetchNetworkInterface;
}());
exports.HTTPFetchNetworkInterface = HTTPFetchNetworkInterface;
function createNetworkInterface(uriOrInterfaceOpts, secondArgOpts) {
    if (secondArgOpts === void 0) { secondArgOpts = {}; }
    if (!uriOrInterfaceOpts) {
        throw new Error('You must pass an options argument to createNetworkInterface.');
    }
    var uri;
    var opts;
    if (isString(uriOrInterfaceOpts)) {
        console.warn("Passing the URI as the first argument to createNetworkInterface is deprecated as of Apollo Client 0.5. Please pass it as the \"uri\" property of the network interface options.");
        opts = secondArgOpts;
        uri = uriOrInterfaceOpts;
    }
    else {
        opts = uriOrInterfaceOpts.opts;
        uri = uriOrInterfaceOpts.uri;
    }
    return new HTTPFetchNetworkInterface(uri, opts);
}
exports.createNetworkInterface = createNetworkInterface;
//# sourceMappingURL=networkInterface.js.map