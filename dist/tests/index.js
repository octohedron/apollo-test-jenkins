"use strict";
require('isomorphic-fetch');
var chai_1 = require('chai');
describe('Test', function () {
    it('should be running', function () {
        chai_1.assert.equal(true, true);
    });
});
require('./QueryManager');
require('./client');
require('./batching');
require('./scheduler');
require('./mutationResults');
require('./optimistic');
require('./fetchMore');
require('./mockNetworkInterface');
require('./graphqlSubscriptions');
require('./batchedNetworkInterface');
require('./ObservableQuery');
require('./subscribeToMore');
require('./customResolvers');
//# sourceMappingURL=index.js.map