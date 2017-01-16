"use strict";
var lodash_1 = require('lodash');
var chai_1 = require('chai');
var graphql_tag_1 = require('graphql-tag');
var apollo_client_1 = require('apollo-client');
var getFromAST_1 = require('apollo-client/queries/getFromAST');
var queryTransform_1 = require('apollo-client/queries/queryTransform');
var actions_1 = require('apollo-client/actions');
var src_1 = require('../src');
describe('optimistic mutation results', function () {
    var query = (_a = ["\n    query todoList {\n      __typename\n      todoList(id: 5) {\n        __typename\n        id\n        todos {\n          id\n          __typename\n          text\n          completed\n        }\n        filteredTodos: todos(completed: true) {\n          id\n          __typename\n          text\n          completed\n        }\n      }\n      noIdList: todoList(id: 6) {\n        __typename\n        id\n        todos {\n          __typename\n          text\n          completed\n        }\n      }\n    }\n  "], _a.raw = ["\n    query todoList {\n      __typename\n      todoList(id: 5) {\n        __typename\n        id\n        todos {\n          id\n          __typename\n          text\n          completed\n        }\n        filteredTodos: todos(completed: true) {\n          id\n          __typename\n          text\n          completed\n        }\n      }\n      noIdList: todoList(id: 6) {\n        __typename\n        id\n        todos {\n          __typename\n          text\n          completed\n        }\n      }\n    }\n  "], graphql_tag_1.default(_a));
    var result = {
        data: {
            __typename: 'Query',
            todoList: {
                __typename: 'TodoList',
                id: '5',
                todos: [
                    {
                        __typename: 'Todo',
                        id: '3',
                        text: 'Hello world',
                        completed: false,
                    },
                    {
                        __typename: 'Todo',
                        id: '6',
                        text: 'Second task',
                        completed: false,
                    },
                    {
                        __typename: 'Todo',
                        id: '12',
                        text: 'Do other stuff',
                        completed: false,
                    },
                ],
                filteredTodos: [],
            },
            noIdList: {
                __typename: 'TodoList',
                id: '7',
                todos: [
                    {
                        __typename: 'Todo',
                        text: 'Hello world',
                        completed: false,
                    },
                    {
                        __typename: 'Todo',
                        text: 'Second task',
                        completed: false,
                    },
                    {
                        __typename: 'Todo',
                        text: 'Do other stuff',
                        completed: false,
                    },
                ],
            },
        },
    };
    var client;
    var networkInterface;
    function customMutationReducer(state, _a) {
        var behavior = _a.behavior;
        var customBehavior = behavior;
        state[customBehavior.dataId] = lodash_1.assign({}, state[customBehavior.dataId], (_b = {},
            _b[customBehavior.field] = customBehavior.value,
            _b
        ));
        return state;
        var _b;
    }
    function setup() {
        var mockedResponses = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            mockedResponses[_i - 0] = arguments[_i];
        }
        networkInterface = src_1.mockNetworkInterface.apply(void 0, [{
            request: { query: query },
            result: result,
        }].concat(mockedResponses));
        client = new apollo_client_1.default({
            networkInterface: networkInterface,
            dataIdFromObject: function (obj) {
                if (obj.id && obj.__typename) {
                    return obj.__typename + obj.id;
                }
                return null;
            },
            mutationBehaviorReducers: {
                'CUSTOM_MUTATION_RESULT': customMutationReducer,
            },
        });
        var obsHandle = client.watchQuery({
            query: query,
        });
        return obsHandle.result();
    }
    ;
    describe('ARRAY_INSERT', function () {
        var mutation = (_a = ["\n      mutation createTodo {\n        # skipping arguments in the test since they don't matter\n        createTodo {\n          id\n          text\n          completed\n          __typename\n        }\n        __typename\n      }\n    "], _a.raw = ["\n      mutation createTodo {\n        # skipping arguments in the test since they don't matter\n        createTodo {\n          id\n          text\n          completed\n          __typename\n        }\n        __typename\n      }\n    "], graphql_tag_1.default(_a));
        var mutationResult = {
            data: {
                __typename: 'Mutation',
                createTodo: {
                    __typename: 'Todo',
                    id: '99',
                    text: 'This one was created with a mutation.',
                    completed: true,
                },
            },
        };
        var optimisticResponse = {
            __typename: 'Mutation',
            createTodo: {
                __typename: 'Todo',
                id: '99',
                text: 'Optimistically generated',
                completed: true,
            },
        };
        it('correctly optimistically integrates a basic object to the list', function () {
            return setup({
                request: { query: mutation },
                result: mutationResult,
            })
                .then(function () {
                var dataId = client.dataId({
                    __typename: 'TodoList',
                    id: '5',
                });
                var promise = client.mutate({
                    mutation: mutation,
                    optimisticResponse: optimisticResponse,
                    resultBehaviors: [
                        {
                            type: 'ARRAY_INSERT',
                            resultPath: ['createTodo'],
                            storePath: [dataId, 'todos'],
                            where: 'PREPEND',
                        },
                    ],
                });
                var dataInStore = client.queryManager.getDataWithOptimisticResults();
                chai_1.assert.equal(dataInStore['Todo99'].text, 'Optimistically generated');
                return promise;
            })
                .then(function () {
                return client.query({ query: query });
            })
                .then(function (newResult) {
                chai_1.assert.equal(newResult.data.todoList.todos.length, 4);
                chai_1.assert.equal(newResult.data.todoList.todos[0].text, 'This one was created with a mutation.');
            });
        });
        var _a;
    });
    describe('DELETE', function () {
        var mutation = (_a = ["\n      mutation deleteTodo {\n        # skipping arguments in the test since they don't matter\n        deleteTodo {\n          id\n          __typename\n        }\n        __typename\n      }\n    "], _a.raw = ["\n      mutation deleteTodo {\n        # skipping arguments in the test since they don't matter\n        deleteTodo {\n          id\n          __typename\n        }\n        __typename\n      }\n    "], graphql_tag_1.default(_a));
        var mutationResult = {
            data: {
                __typename: 'Mutation',
                deleteTodo: {
                    __typename: 'Todo',
                    id: '3',
                },
            },
        };
        var optimisticResponse = mutationResult.data;
        it('correctly optimistically deletes object from array', function () {
            return setup({
                request: { query: mutation },
                result: mutationResult,
            })
                .then(function () {
                var promise = client.mutate({
                    mutation: mutation,
                    optimisticResponse: optimisticResponse,
                    resultBehaviors: [
                        {
                            type: 'DELETE',
                            dataId: 'Todo3',
                        },
                    ],
                });
                var dataInStore = client.queryManager.getDataWithOptimisticResults();
                var refsList = dataInStore['TodoList5'].todos;
                chai_1.assert.notInclude(refsList, 'Todo3');
                return promise;
            })
                .then(function () {
                return client.query({ query: query });
            })
                .then(function (newResult) {
                chai_1.assert.equal(newResult.data.todoList.todos.length, 2);
                chai_1.assert.notProperty(client.queryManager.getApolloState().data, 'Todo3');
            });
        });
        var _a;
    });
    describe('CUSTOM_MUTATION_RESULT', function () {
        var mutation = (_a = ["\n      mutation setField {\n        # skipping arguments in the test since they don't matter\n        setSomething {\n          aValue\n          __typename\n        }\n        __typename\n      }\n    "], _a.raw = ["\n      mutation setField {\n        # skipping arguments in the test since they don't matter\n        setSomething {\n          aValue\n          __typename\n        }\n        __typename\n      }\n    "], graphql_tag_1.default(_a));
        var mutationResult = {
            data: {
                __typename: 'Mutation',
                setSomething: {
                    __typename: 'Value',
                    aValue: 'rainbow',
                },
            },
        };
        var optimisticResponse = {
            __typename: 'Mutation',
            setSomething: {
                __typename: 'Value',
                aValue: 'Does not matter',
            },
        };
        it('optimistically runs the custom reducer', function () {
            return setup({
                request: { query: mutation },
                result: mutationResult,
            })
                .then(function () {
                var promise = client.mutate({
                    mutation: mutation,
                    optimisticResponse: optimisticResponse,
                    resultBehaviors: [
                        {
                            type: 'CUSTOM_MUTATION_RESULT',
                            dataId: 'Todo3',
                            field: 'text',
                            value: 'this is the new text',
                        },
                    ],
                });
                var dataInStore = client.queryManager.getDataWithOptimisticResults();
                chai_1.assert.equal(dataInStore['Todo3'].text, 'this is the new text');
                return promise;
            })
                .then(function () {
                return client.query({ query: query });
            })
                .then(function (newResult) {
                chai_1.assert.equal(newResult.data.todoList.todos[0].text, 'this is the new text');
            });
        });
        var _a;
    });
    describe('ARRAY_DELETE', function () {
        var mutation = (_a = ["\n      mutation deleteTodoFromList {\n        # skipping arguments in the test since they don't matter\n        deleteTodoFromList {\n          id\n          __typename\n        }\n        __typename\n      }\n    "], _a.raw = ["\n      mutation deleteTodoFromList {\n        # skipping arguments in the test since they don't matter\n        deleteTodoFromList {\n          id\n          __typename\n        }\n        __typename\n      }\n    "], graphql_tag_1.default(_a));
        var mutationResult = {
            data: {
                __typename: 'Mutation',
                deleteTodoFromList: {
                    __typename: 'Todo',
                    id: '3',
                },
            },
        };
        var optimisticResponse = mutationResult.data;
        it('optimistically removes item from array but not from store', function () {
            return setup({
                request: { query: mutation },
                result: mutationResult,
            })
                .then(function () {
                var dataId = client.dataId({
                    __typename: 'TodoList',
                    id: '5',
                });
                var promise = client.mutate({
                    mutation: mutation,
                    optimisticResponse: optimisticResponse,
                    resultBehaviors: [
                        {
                            type: 'ARRAY_DELETE',
                            dataId: 'Todo3',
                            storePath: [dataId, 'todos'],
                        },
                    ],
                });
                var dataInStore = client.queryManager.getDataWithOptimisticResults();
                var refsList = dataInStore['TodoList5'].todos;
                chai_1.assert.notInclude(refsList, 'Todo3');
                chai_1.assert.property(dataInStore, 'Todo3');
                return promise;
            })
                .then(function () {
                return client.query({ query: query });
            })
                .then(function (newResult) {
                chai_1.assert.equal(newResult.data.todoList.todos.length, 2);
                chai_1.assert.property(client.queryManager.getApolloState().data, 'Todo3');
            });
        });
        var _a;
    });
    describe('error handling', function () {
        var mutation = (_a = ["\n      mutation createTodo {\n        # skipping arguments in the test since they don't matter\n        createTodo {\n          id\n          text\n          completed\n          __typename\n        }\n        __typename\n      }\n    "], _a.raw = ["\n      mutation createTodo {\n        # skipping arguments in the test since they don't matter\n        createTodo {\n          id\n          text\n          completed\n          __typename\n        }\n        __typename\n      }\n    "], graphql_tag_1.default(_a));
        var mutationResult = {
            data: {
                __typename: 'Mutation',
                createTodo: {
                    __typename: 'Todo',
                    id: '99',
                    text: 'This one was created with a mutation.',
                    completed: true,
                },
            },
        };
        var mutationResult2 = {
            data: lodash_1.assign({}, mutationResult.data, {
                createTodo: lodash_1.assign({}, mutationResult.data.createTodo, {
                    id: '66',
                    text: 'Second mutation.',
                }),
            }),
        };
        var optimisticResponse = {
            __typename: 'Mutation',
            createTodo: {
                __typename: 'Todo',
                id: '99',
                text: 'Optimistically generated',
                completed: true,
            },
        };
        var optimisticResponse2 = lodash_1.assign({}, optimisticResponse, {
            createTodo: lodash_1.assign({}, optimisticResponse.createTodo, {
                id: '66',
                text: 'Optimistically generated 2',
            }),
        });
        it('handles a single error for a single mutation', function () {
            return setup({
                request: { query: mutation },
                error: new Error('forbidden (test error)'),
            })
                .then(function () {
                var dataId = client.dataId({
                    __typename: 'TodoList',
                    id: '5',
                });
                var promise = client.mutate({
                    mutation: mutation,
                    optimisticResponse: optimisticResponse,
                    resultBehaviors: [
                        {
                            type: 'ARRAY_INSERT',
                            resultPath: ['createTodo'],
                            storePath: [dataId, 'todos'],
                            where: 'PREPEND',
                        },
                    ],
                });
                var dataInStore = client.queryManager.getDataWithOptimisticResults();
                chai_1.assert.equal(dataInStore['TodoList5'].todos.length, 4);
                chai_1.assert.equal(dataInStore['Todo99'].text, 'Optimistically generated');
                return promise;
            })
                .catch(function (err) {
                chai_1.assert.instanceOf(err, Error);
                chai_1.assert.equal(err.message, 'Network error: forbidden (test error)');
                var dataInStore = client.queryManager.getDataWithOptimisticResults();
                chai_1.assert.equal(dataInStore['TodoList5'].todos.length, 3);
                chai_1.assert.notProperty(dataInStore, 'Todo99');
            });
        });
        it('handles errors produced by one mutation in a series', function () {
            return setup({
                request: { query: mutation },
                error: new Error('forbidden (test error)'),
            }, {
                request: { query: mutation },
                result: mutationResult2,
            })
                .then(function () {
                var dataId = client.dataId({
                    __typename: 'TodoList',
                    id: '5',
                });
                var resultBehaviors = [
                    {
                        type: 'ARRAY_INSERT',
                        resultPath: ['createTodo'],
                        storePath: [dataId, 'todos'],
                        where: 'PREPEND',
                    },
                ];
                var promise = client.mutate({
                    mutation: mutation,
                    optimisticResponse: optimisticResponse,
                    resultBehaviors: resultBehaviors,
                }).catch(function (err) {
                    chai_1.assert.instanceOf(err, Error);
                    chai_1.assert.equal(err.message, 'Network error: forbidden (test error)');
                    return null;
                });
                var promise2 = client.mutate({
                    mutation: mutation,
                    optimisticResponse: optimisticResponse2,
                    resultBehaviors: resultBehaviors,
                });
                var dataInStore = client.queryManager.getDataWithOptimisticResults();
                chai_1.assert.equal(dataInStore['TodoList5'].todos.length, 5);
                chai_1.assert.equal(dataInStore['Todo99'].text, 'Optimistically generated');
                chai_1.assert.equal(dataInStore['Todo66'].text, 'Optimistically generated 2');
                return Promise.all([promise, promise2]);
            })
                .then(function () {
                var dataInStore = client.queryManager.getDataWithOptimisticResults();
                chai_1.assert.equal(dataInStore['TodoList5'].todos.length, 4);
                chai_1.assert.notProperty(dataInStore, 'Todo99');
                chai_1.assert.property(dataInStore, 'Todo66');
                chai_1.assert.include(dataInStore['TodoList5'].todos, realIdValue('Todo66'));
                chai_1.assert.notInclude(dataInStore['TodoList5'].todos, realIdValue('Todo99'));
            });
        });
        it('can run 2 mutations concurrently and handles all intermediate states well', function () {
            function checkBothMutationsAreApplied(expectedText1, expectedText2) {
                var dataInStore = client.queryManager.getDataWithOptimisticResults();
                chai_1.assert.equal(dataInStore['TodoList5'].todos.length, 5);
                chai_1.assert.property(dataInStore, 'Todo99');
                chai_1.assert.property(dataInStore, 'Todo66');
                chai_1.assert.include(dataInStore['TodoList5'].todos, realIdValue('Todo66'));
                chai_1.assert.include(dataInStore['TodoList5'].todos, realIdValue('Todo99'));
                chai_1.assert.equal(dataInStore['Todo99'].text, expectedText1);
                chai_1.assert.equal(dataInStore['Todo66'].text, expectedText2);
            }
            return setup({
                request: { query: mutation },
                result: mutationResult,
            }, {
                request: { query: mutation },
                result: mutationResult2,
                delay: 100,
            })
                .then(function () {
                var dataId = client.dataId({
                    __typename: 'TodoList',
                    id: '5',
                });
                var resultBehaviors = [
                    {
                        type: 'ARRAY_INSERT',
                        resultPath: ['createTodo'],
                        storePath: [dataId, 'todos'],
                        where: 'PREPEND',
                    },
                ];
                var promise = client.mutate({
                    mutation: mutation,
                    optimisticResponse: optimisticResponse,
                    resultBehaviors: resultBehaviors,
                }).then(function (res) {
                    checkBothMutationsAreApplied('This one was created with a mutation.', 'Optimistically generated 2');
                    var mutationsState = client.store.getState().apollo.mutations;
                    chai_1.assert.equal(mutationsState[2].loading, false);
                    chai_1.assert.equal(mutationsState[3].loading, true);
                    return res;
                });
                var promise2 = client.mutate({
                    mutation: mutation,
                    optimisticResponse: optimisticResponse2,
                    resultBehaviors: resultBehaviors,
                }).then(function (res) {
                    checkBothMutationsAreApplied('This one was created with a mutation.', 'Second mutation.');
                    var mutationsState = client.store.getState().apollo.mutations;
                    chai_1.assert.equal(mutationsState[2].loading, false);
                    chai_1.assert.equal(mutationsState[3].loading, false);
                    return res;
                });
                var mutationsState = client.store.getState().apollo.mutations;
                chai_1.assert.equal(mutationsState[2].loading, true);
                chai_1.assert.equal(mutationsState[3].loading, true);
                checkBothMutationsAreApplied('Optimistically generated', 'Optimistically generated 2');
                return Promise.all([promise, promise2]);
            })
                .then(function () {
                checkBothMutationsAreApplied('This one was created with a mutation.', 'Second mutation.');
            });
        });
        var _a;
    });
    describe('optimistic updates using updateQueries', function () {
        var mutation = (_a = ["\n      mutation createTodo {\n        # skipping arguments in the test since they don't matter\n        createTodo {\n          id\n          text\n          completed\n          __typename\n        }\n        __typename\n      }\n    "], _a.raw = ["\n      mutation createTodo {\n        # skipping arguments in the test since they don't matter\n        createTodo {\n          id\n          text\n          completed\n          __typename\n        }\n        __typename\n      }\n    "], graphql_tag_1.default(_a));
        var mutationResult = {
            data: {
                __typename: 'Mutation',
                createTodo: {
                    id: '99',
                    __typename: 'Todo',
                    text: 'This one was created with a mutation.',
                    completed: true,
                },
            },
        };
        var optimisticResponse = {
            __typename: 'Mutation',
            createTodo: {
                __typename: 'Todo',
                id: '99',
                text: 'Optimistically generated',
                completed: true,
            },
        };
        var mutationResult2 = {
            data: lodash_1.assign({}, mutationResult.data, {
                createTodo: lodash_1.assign({}, mutationResult.data.createTodo, {
                    id: '66',
                    text: 'Second mutation.',
                }),
            }),
        };
        var optimisticResponse2 = {
            __typename: 'Mutation',
            createTodo: {
                __typename: 'Todo',
                id: '66',
                text: 'Optimistically generated 2',
                completed: true,
            },
        };
        it('analogous of ARRAY_INSERT', function () {
            return setup({
                request: { query: mutation },
                result: mutationResult,
            })
                .then(function () {
                var promise = client.mutate({
                    mutation: mutation,
                    optimisticResponse: optimisticResponse,
                    updateQueries: {
                        todoList: function (prev, options) {
                            var mResult = options.mutationResult;
                            chai_1.assert.equal(mResult.data.createTodo.id, '99');
                            var state = lodash_1.cloneDeep(prev);
                            state.todoList.todos.unshift(mResult.data.createTodo);
                            return state;
                        },
                    },
                });
                var dataInStore = client.queryManager.getDataWithOptimisticResults();
                chai_1.assert.equal(dataInStore['TodoList5'].todos.length, 4);
                chai_1.assert.equal(dataInStore['Todo99'].text, 'Optimistically generated');
                return promise;
            })
                .then(function () {
                return client.query({ query: query });
            })
                .then(function (newResult) {
                chai_1.assert.equal(newResult.data.todoList.todos.length, 4);
                chai_1.assert.equal(newResult.data.todoList.todos[0].text, 'This one was created with a mutation.');
            });
        });
        it('two ARRAY_INSERT like mutations', function () {
            return setup({
                request: { query: mutation },
                result: mutationResult,
            }, {
                request: { query: mutation },
                result: mutationResult2,
                delay: 50,
            })
                .then(function () {
                var updateQueries = {
                    todoList: function (prev, options) {
                        var mResult = options.mutationResult;
                        var state = lodash_1.cloneDeep(prev);
                        state.todoList.todos.unshift(mResult.data.createTodo);
                        return state;
                    },
                };
                var promise = client.mutate({
                    mutation: mutation,
                    optimisticResponse: optimisticResponse,
                    updateQueries: updateQueries,
                }).then(function (res) {
                    var dataInStore = client.queryManager.getDataWithOptimisticResults();
                    chai_1.assert.equal(dataInStore['TodoList5'].todos.length, 5);
                    chai_1.assert.equal(dataInStore['Todo99'].text, 'This one was created with a mutation.');
                    chai_1.assert.equal(dataInStore['Todo66'].text, 'Optimistically generated 2');
                    return res;
                });
                var promise2 = client.mutate({
                    mutation: mutation,
                    optimisticResponse: optimisticResponse2,
                    updateQueries: updateQueries,
                });
                var dataInStore = client.queryManager.getDataWithOptimisticResults();
                chai_1.assert.equal(dataInStore['TodoList5'].todos.length, 5);
                chai_1.assert.equal(dataInStore['Todo99'].text, 'Optimistically generated');
                chai_1.assert.equal(dataInStore['Todo66'].text, 'Optimistically generated 2');
                return Promise.all([promise, promise2]);
            })
                .then(function () {
                return client.query({ query: query });
            })
                .then(function (newResult) {
                chai_1.assert.equal(newResult.data.todoList.todos.length, 5);
                chai_1.assert.equal(newResult.data.todoList.todos[0].text, 'Second mutation.');
                chai_1.assert.equal(newResult.data.todoList.todos[1].text, 'This one was created with a mutation.');
            });
        });
        it('two mutations, one fails', function () {
            return setup({
                request: { query: mutation },
                error: new Error('forbidden (test error)'),
            }, {
                request: { query: mutation },
                result: mutationResult2,
            })
                .then(function () {
                var updateQueries = {
                    todoList: function (prev, options) {
                        var mResult = options.mutationResult;
                        var state = lodash_1.cloneDeep(prev);
                        state.todoList.todos.unshift(mResult.data.createTodo);
                        return state;
                    },
                };
                var promise = client.mutate({
                    mutation: mutation,
                    optimisticResponse: optimisticResponse,
                    updateQueries: updateQueries,
                }).catch(function (err) {
                    chai_1.assert.instanceOf(err, Error);
                    chai_1.assert.equal(err.message, 'Network error: forbidden (test error)');
                    return null;
                });
                var promise2 = client.mutate({
                    mutation: mutation,
                    optimisticResponse: optimisticResponse2,
                    updateQueries: updateQueries,
                });
                var dataInStore = client.queryManager.getDataWithOptimisticResults();
                chai_1.assert.equal(dataInStore['TodoList5'].todos.length, 5);
                chai_1.assert.equal(dataInStore['Todo99'].text, 'Optimistically generated');
                chai_1.assert.equal(dataInStore['Todo66'].text, 'Optimistically generated 2');
                return Promise.all([promise, promise2]);
            })
                .then(function () {
                var dataInStore = client.queryManager.getDataWithOptimisticResults();
                chai_1.assert.equal(dataInStore['TodoList5'].todos.length, 4);
                chai_1.assert.notProperty(dataInStore, 'Todo99');
                chai_1.assert.property(dataInStore, 'Todo66');
                chai_1.assert.include(dataInStore['TodoList5'].todos, realIdValue('Todo66'));
                chai_1.assert.notInclude(dataInStore['TodoList5'].todos, realIdValue('Todo99'));
            });
        });
        var _a;
    });
    describe('optimistic updates with result reducer', function () {
        var mutation = (_a = ["\n      mutation createTodo {\n        # skipping arguments in the test since they don't matter\n        createTodo {\n          id\n          text\n          completed\n          __typename\n        }\n        __typename\n      }\n    "], _a.raw = ["\n      mutation createTodo {\n        # skipping arguments in the test since they don't matter\n        createTodo {\n          id\n          text\n          completed\n          __typename\n        }\n        __typename\n      }\n    "], graphql_tag_1.default(_a));
        var mutationResult = {
            data: {
                __typename: 'Mutation',
                createTodo: {
                    id: '99',
                    __typename: 'Todo',
                    text: 'This one was created with a mutation.',
                    completed: true,
                },
            },
        };
        var optimisticResponse = {
            __typename: 'Mutation',
            createTodo: {
                __typename: 'Todo',
                id: '99',
                text: 'Optimistically generated',
                completed: true,
            },
        };
        it('can add an item to an array', function () {
            var observableQuery;
            var counter = 0;
            return setup({
                request: { query: mutation },
                result: mutationResult,
            })
                .then(function () {
                observableQuery = client.watchQuery({
                    query: query,
                    reducer: function (previousResult, action) {
                        counter++;
                        if (actions_1.isMutationResultAction(action)) {
                            var newResult = lodash_1.cloneDeep(previousResult);
                            newResult.todoList.todos.unshift(action.result.data.createTodo);
                            return newResult;
                        }
                        return previousResult;
                    },
                }).subscribe({
                    next: function () { return null; },
                });
            })
                .then(function () {
                var promise = client.mutate({
                    mutation: mutation,
                    optimisticResponse: optimisticResponse,
                });
                var dataInStore = client.queryManager.getDataWithOptimisticResults();
                chai_1.assert.equal(dataInStore['TodoList5'].todos.length, 4);
                chai_1.assert.equal(dataInStore['Todo99'].text, 'Optimistically generated');
                return promise;
            })
                .then(function () {
                return client.query({ query: query });
            })
                .then(function (newResult) {
                chai_1.assert.equal(newResult.data.todoList.todos.length, 4);
                chai_1.assert.equal(newResult.data.todoList.todos[0].text, 'This one was created with a mutation.');
            });
        });
        var _a;
    });
    var _a;
});
describe('optimistic mutation - githunt comments', function () {
    var query = (_a = ["\n    query Comment($repoName: String!) {\n      entry(repoFullName: $repoName) {\n        comments {\n          postedBy {\n            login\n            html_url\n          }\n        }\n      }\n    }\n  "], _a.raw = ["\n    query Comment($repoName: String!) {\n      entry(repoFullName: $repoName) {\n        comments {\n          postedBy {\n            login\n            html_url\n          }\n        }\n      }\n    }\n  "], graphql_tag_1.default(_a));
    var fragment = apollo_client_1.createFragment((_b = ["\n    fragment authorFields on User {\n      postedBy {\n        login\n        html_url\n      }\n    }\n  "], _b.raw = ["\n    fragment authorFields on User {\n      postedBy {\n        login\n        html_url\n      }\n    }\n  "], graphql_tag_1.default(_b)));
    var fragmentWithTypenames = apollo_client_1.createFragment((_c = ["\n    fragment authorFields on User {\n      postedBy {\n        login\n        html_url\n        __typename\n      }\n      __typename\n    }\n  "], _c.raw = ["\n    fragment authorFields on User {\n      postedBy {\n        login\n        html_url\n        __typename\n      }\n      __typename\n    }\n  "], graphql_tag_1.default(_c)));
    var queryWithFragment = (_d = ["\n    query Comment($repoName: String!) {\n      entry(repoFullName: $repoName) {\n        comments {\n          ...authorFields\n        }\n      }\n    }\n  "], _d.raw = ["\n    query Comment($repoName: String!) {\n      entry(repoFullName: $repoName) {\n        comments {\n          ...authorFields\n        }\n      }\n    }\n  "], graphql_tag_1.default(_d));
    var variables = {
        repoName: 'org/repo',
    };
    var userDoc = {
        __typename: 'User',
        login: 'stubailo',
        html_url: 'http://avatar.com/stubailo.png',
    };
    var result = {
        data: {
            __typename: 'Query',
            entry: {
                __typename: 'Entry',
                comments: [
                    {
                        __typename: 'Comment',
                        postedBy: userDoc,
                    },
                ],
            },
        },
    };
    var client;
    var networkInterface;
    function setup() {
        var mockedResponses = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            mockedResponses[_i - 0] = arguments[_i];
        }
        networkInterface = src_1.mockNetworkInterface.apply(void 0, [{
            request: {
                query: queryTransform_1.addTypenameToDocument(query),
                variables: variables,
            },
            result: result,
        }, {
            request: {
                query: getFromAST_1.addFragmentsToDocument(queryTransform_1.addTypenameToDocument(queryWithFragment), fragment),
                variables: variables,
            },
            result: result,
        }].concat(mockedResponses));
        client = new apollo_client_1.default({
            networkInterface: networkInterface,
            dataIdFromObject: function (obj) {
                if (obj.id && obj.__typename) {
                    return obj.__typename + obj.id;
                }
                return null;
            },
        });
        var obsHandle = client.watchQuery({
            query: query,
            variables: variables,
        });
        return obsHandle.result();
    }
    ;
    var mutation = (_e = ["\n    mutation submitComment($repoFullName: String!, $commentContent: String!) {\n      submitComment(repoFullName: $repoFullName, commentContent: $commentContent) {\n        postedBy {\n          login\n          html_url\n        }\n      }\n    }\n  "], _e.raw = ["\n    mutation submitComment($repoFullName: String!, $commentContent: String!) {\n      submitComment(repoFullName: $repoFullName, commentContent: $commentContent) {\n        postedBy {\n          login\n          html_url\n        }\n      }\n    }\n  "], graphql_tag_1.default(_e));
    var mutationWithFragment = (_f = ["\n    mutation submitComment($repoFullName: String!, $commentContent: String!) {\n      submitComment(repoFullName: $repoFullName, commentContent: $commentContent) {\n        ...authorFields\n      }\n    }\n  "], _f.raw = ["\n    mutation submitComment($repoFullName: String!, $commentContent: String!) {\n      submitComment(repoFullName: $repoFullName, commentContent: $commentContent) {\n        ...authorFields\n      }\n    }\n  "], graphql_tag_1.default(_f));
    var mutationResult = {
        data: {
            __typename: 'Mutation',
            submitComment: {
                __typename: 'Comment',
                postedBy: userDoc,
            },
        },
    };
    var updateQueries = {
        Comment: function (prev, _a) {
            var mutationResultArg = _a.mutationResult;
            var newComment = mutationResultArg.data.submitComment;
            var state = lodash_1.cloneDeep(prev);
            state.entry.comments.unshift(newComment);
            return state;
        },
    };
    var optimisticResponse = {
        __typename: 'Mutation',
        submitComment: {
            __typename: 'Comment',
            postedBy: userDoc,
        },
    };
    it('can post a new comment', function () {
        var mutationVariables = {
            repoFullName: 'org/repo',
            commentContent: 'New Comment',
        };
        return setup({
            request: {
                query: queryTransform_1.addTypenameToDocument(mutation),
                variables: mutationVariables,
            },
            result: mutationResult,
        }).then(function () {
            return client.mutate({
                mutation: mutation,
                optimisticResponse: optimisticResponse,
                variables: mutationVariables,
                updateQueries: updateQueries,
            });
        }).then(function () {
            return client.query({ query: query, variables: variables });
        }).then(function (newResult) {
            chai_1.assert.equal(newResult.data.entry.comments.length, 2);
        });
    });
    it('can post a new comment (with fragments)', function () {
        var mutationVariables = {
            repoFullName: 'org/repo',
            commentContent: 'New Comment',
        };
        return setup({
            request: {
                query: getFromAST_1.addFragmentsToDocument(queryTransform_1.addTypenameToDocument(mutationWithFragment), fragmentWithTypenames),
                variables: mutationVariables,
            },
            result: mutationResult,
        }).then(function () {
            return client.mutate({
                mutation: mutationWithFragment,
                optimisticResponse: optimisticResponse,
                variables: mutationVariables,
                updateQueries: updateQueries,
                fragments: fragment,
            });
        }).then(function () {
            return client.query({ query: queryWithFragment, variables: variables, fragments: fragment });
        }).then(function (newResult) {
            chai_1.assert.equal(newResult.data.entry.comments.length, 2);
        });
    });
    var _a, _b, _c, _d, _e, _f;
});
function realIdValue(id) {
    return {
        type: 'id',
        generated: false,
        id: id,
    };
}
//# sourceMappingURL=optimistic.js.map