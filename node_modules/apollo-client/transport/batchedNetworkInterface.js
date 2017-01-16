"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
require("whatwg-fetch");
var assign = require("lodash/assign");
var isNumber = require("lodash/isNumber");
var networkInterface_1 = require("./networkInterface");
var batching_1 = require("./batching");
var HTTPBatchedNetworkInterface = (function (_super) {
    __extends(HTTPBatchedNetworkInterface, _super);
    function HTTPBatchedNetworkInterface(uri, pollInterval, fetchOpts) {
        var _this = _super.call(this, uri, fetchOpts) || this;
        if (!isNumber(pollInterval)) {
            throw new Error("pollInterval must be a number, got " + pollInterval);
        }
        _this.pollInterval = pollInterval;
        _this.batcher = new batching_1.QueryBatcher({
            batchFetchFunction: _this.batchQuery.bind(_this),
        });
        _this.batcher.start(_this.pollInterval);
        return _this;
    }
    ;
    HTTPBatchedNetworkInterface.prototype.query = function (request) {
        return this.batcher.enqueueRequest(request);
    };
    HTTPBatchedNetworkInterface.prototype.batchQuery = function (requests) {
        var _this = this;
        var options = assign({}, this._opts);
        var middlewarePromises = [];
        requests.forEach(function (request) {
            middlewarePromises.push(_this.applyMiddlewares({
                request: request,
                options: options,
            }));
        });
        return new Promise(function (resolve, reject) {
            Promise.all(middlewarePromises).then(function (requestsAndOptions) {
                return _this.batchedFetchFromRemoteEndpoint(requestsAndOptions)
                    .then(function (result) {
                    return result.json();
                })
                    .then(function (responses) {
                    if (typeof responses.map !== 'function') {
                        throw new Error('BatchingNetworkInterface: server response is not an array');
                    }
                    var afterwaresPromises = responses.map(function (response, index) {
                        return _this.applyAfterwares({
                            response: response,
                            options: requestsAndOptions[index].options,
                        });
                    });
                    Promise.all(afterwaresPromises).then(function (responsesAndOptions) {
                        var results = [];
                        responsesAndOptions.forEach(function (result) {
                            results.push(result.response);
                        });
                        resolve(results);
                    }).catch(function (error) {
                        reject(error);
                    });
                });
            }).catch(function (error) {
                reject(error);
            });
        });
    };
    HTTPBatchedNetworkInterface.prototype.batchedFetchFromRemoteEndpoint = function (requestsAndOptions) {
        var options = {};
        requestsAndOptions.forEach(function (requestAndOptions) {
            assign(options, requestAndOptions.options);
        });
        var printedRequests = requestsAndOptions.map(function (_a) {
            var request = _a.request;
            return networkInterface_1.printRequest(request);
        });
        return fetch(this._uri, assign({}, this._opts, {
            body: JSON.stringify(printedRequests),
            method: 'POST',
        }, options, {
            headers: assign({}, {
                Accept: '*/*',
                'Content-Type': 'application/json',
            }, options.headers),
        }));
    };
    ;
    return HTTPBatchedNetworkInterface;
}(networkInterface_1.HTTPFetchNetworkInterface));
exports.HTTPBatchedNetworkInterface = HTTPBatchedNetworkInterface;
function createBatchingNetworkInterface(options) {
    if (!options) {
        throw new Error('You must pass an options argument to createNetworkInterface.');
    }
    return new HTTPBatchedNetworkInterface(options.uri, options.batchInterval, options.opts);
}
exports.createBatchingNetworkInterface = createBatchingNetworkInterface;
//# sourceMappingURL=batchedNetworkInterface.js.map