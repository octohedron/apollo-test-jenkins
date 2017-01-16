"use strict";
var lodash_1 = require('lodash');
var chai_1 = require('chai');
var graphql_tag_1 = require('graphql-tag');
var apollo_client_1 = require('apollo-client');
var mutationResults_1 = require('apollo-client/data/mutationResults');
var actions_1 = require('apollo-client/actions');
var src_1 = require('../src');
describe('mutation results', function () {
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
    function setupObsHandle() {
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
            addTypename: true,
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
        return client.watchQuery({
            query: query,
        });
    }
    function setup() {
        var mockedResponses = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            mockedResponses[_i - 0] = arguments[_i];
        }
        var obsHandle = setupObsHandle.apply(void 0, mockedResponses);
        return obsHandle.result();
    }
    ;
    it('correctly primes cache for tests', function () {
        return setup()
            .then(function () { return client.query({
            query: query,
        }); });
    });
    it('correctly integrates field changes by default', function () {
        var mutation = (_a = ["\n      mutation setCompleted {\n        setCompleted(todoId: \"3\") {\n          id\n          completed\n          __typename\n        }\n        __typename\n      }\n    "], _a.raw = ["\n      mutation setCompleted {\n        setCompleted(todoId: \"3\") {\n          id\n          completed\n          __typename\n        }\n        __typename\n      }\n    "], graphql_tag_1.default(_a));
        var mutationResult = {
            data: {
                __typename: 'Mutation',
                setCompleted: {
                    __typename: 'Todo',
                    id: '3',
                    completed: true,
                },
            },
        };
        return setup({
            request: { query: mutation },
            result: mutationResult,
        })
            .then(function () {
            return client.mutate({ mutation: mutation });
        })
            .then(function () {
            return client.query({ query: query });
        })
            .then(function (newResult) {
            chai_1.assert.isTrue(newResult.data.todoList.todos[0].completed);
        });
        var _a;
    });
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
        var mutationNoId = (_b = ["\n      mutation createTodo {\n        # skipping arguments in the test since they don't matter\n        createTodo {\n          text\n          completed\n          __typename\n        }\n        __typename\n      }\n    "], _b.raw = ["\n      mutation createTodo {\n        # skipping arguments in the test since they don't matter\n        createTodo {\n          text\n          completed\n          __typename\n        }\n        __typename\n      }\n    "], graphql_tag_1.default(_b));
        var mutationResultNoId = {
            data: {
                __typename: 'Mutation',
                createTodo: {
                    __typename: 'Todo',
                    text: 'This one was created with a mutation.',
                    completed: true,
                },
            },
        };
        it('correctly integrates a basic object at the beginning', function () {
            return setup({
                request: { query: mutation },
                result: mutationResult,
            })
                .then(function () {
                var dataId = client.dataId({
                    __typename: 'TodoList',
                    id: '5',
                });
                return client.mutate({
                    mutation: mutation,
                    resultBehaviors: [
                        {
                            type: 'ARRAY_INSERT',
                            resultPath: ['createTodo'],
                            storePath: [dataId, 'todos'],
                            where: 'PREPEND',
                        },
                    ],
                });
            })
                .then(function () {
                return client.query({ query: query });
            })
                .then(function (newResult) {
                chai_1.assert.equal(newResult.data.todoList.todos.length, 4);
                chai_1.assert.equal(newResult.data.todoList.todos[0].text, 'This one was created with a mutation.');
            });
        });
        it('correctly integrates a basic object at the end', function () {
            return setup({
                request: { query: mutation },
                result: mutationResult,
            })
                .then(function () {
                return client.mutate({
                    mutation: mutation,
                    resultBehaviors: [
                        {
                            type: 'ARRAY_INSERT',
                            resultPath: ['createTodo'],
                            storePath: ['TodoList5', 'todos'],
                            where: 'APPEND',
                        },
                    ],
                });
            })
                .then(function () {
                return client.query({ query: query });
            })
                .then(function (newResult) {
                chai_1.assert.equal(newResult.data.todoList.todos.length, 4);
                chai_1.assert.equal(newResult.data.todoList.todos[3].text, 'This one was created with a mutation.');
            });
        });
        it('correctly integrates a basic object at the end with arguments', function () {
            return setup({
                request: { query: mutation },
                result: mutationResult,
            })
                .then(function () {
                return client.mutate({
                    mutation: mutation,
                    resultBehaviors: [
                        {
                            type: 'ARRAY_INSERT',
                            resultPath: ['createTodo'],
                            storePath: [
                                'TodoList5',
                                client.fieldWithArgs('todos', { completed: true }),
                            ],
                            where: 'APPEND',
                        },
                    ],
                });
            })
                .then(function () {
                return client.query({ query: query });
            })
                .then(function (newResult) {
                chai_1.assert.equal(newResult.data.todoList.filteredTodos.length, 1);
                chai_1.assert.equal(newResult.data.todoList.filteredTodos[0].text, 'This one was created with a mutation.');
            });
        });
        it('correctly integrates a basic object at the end without id', function () {
            return setup({
                request: { query: mutationNoId },
                result: mutationResultNoId,
            })
                .then(function () {
                return client.mutate({
                    mutation: mutationNoId,
                    resultBehaviors: [
                        {
                            type: 'ARRAY_INSERT',
                            resultPath: ['createTodo'],
                            storePath: ['TodoList7', 'todos'],
                            where: 'APPEND',
                        },
                    ],
                });
            })
                .then(function () {
                return client.query({ query: query });
            })
                .then(function (newResult) {
                chai_1.assert.equal(newResult.data.noIdList.todos.length, 4);
                chai_1.assert.equal(newResult.data.noIdList.todos[3].text, 'This one was created with a mutation.');
            });
        });
        it('accepts two operations', function () {
            return setup({
                request: { query: mutation },
                result: mutationResult,
            })
                .then(function () {
                return client.mutate({
                    mutation: mutation,
                    resultBehaviors: [
                        {
                            type: 'ARRAY_INSERT',
                            resultPath: ['createTodo'],
                            storePath: ['TodoList5', 'todos'],
                            where: 'PREPEND',
                        }, {
                            type: 'ARRAY_INSERT',
                            resultPath: ['createTodo'],
                            storePath: ['TodoList5', 'todos'],
                            where: 'APPEND',
                        },
                    ],
                });
            })
                .then(function () {
                return client.query({ query: query });
            })
                .then(function (newResult) {
                chai_1.assert.equal(newResult.data.todoList.todos.length, 5);
                chai_1.assert.equal(newResult.data.todoList.todos[0].text, 'This one was created with a mutation.');
                chai_1.assert.equal(newResult.data.todoList.todos[4].text, 'This one was created with a mutation.');
            });
        });
        var _a, _b;
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
        it('deletes object from array and store', function () {
            return setup({
                request: { query: mutation },
                result: mutationResult,
            })
                .then(function () {
                return client.mutate({
                    mutation: mutation,
                    resultBehaviors: [
                        {
                            type: 'DELETE',
                            dataId: 'Todo3',
                        },
                    ],
                });
            })
                .then(function () {
                return client.query({ query: query });
            })
                .then(function (newResult) {
                chai_1.assert.equal(newResult.data.todoList.todos.length, 2);
                chai_1.assert.notProperty(client.queryManager.getApolloState().data, 'Todo3');
                chai_1.assert.notEqual(client.queryManager.getApolloState().data['TodoList5']['__typename'], undefined);
            });
        });
        var _a;
    });
    describe('ARRAY_DELETE', function () {
        var mutation = (_a = ["\n      mutation removeTodo {\n        # skipping arguments in the test since they don't matter\n        removeTodo {\n          id\n          __typename\n        }\n        __typename\n      }\n    "], _a.raw = ["\n      mutation removeTodo {\n        # skipping arguments in the test since they don't matter\n        removeTodo {\n          id\n          __typename\n        }\n        __typename\n      }\n    "], graphql_tag_1.default(_a));
        var mutationResult = {
            data: {
                __typename: 'Mutation',
                removeTodo: {
                    __typename: 'Todo',
                    id: '3',
                },
            },
        };
        it('deletes an object from array but not store', function () {
            return setup({
                request: { query: mutation },
                result: mutationResult,
            })
                .then(function () {
                return client.mutate({
                    mutation: mutation,
                    resultBehaviors: [
                        {
                            type: 'ARRAY_DELETE',
                            dataId: 'Todo3',
                            storePath: ['TodoList5', 'todos'],
                        },
                    ],
                });
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
        it('runs the custom reducer', function () {
            return setup({
                request: { query: mutation },
                result: mutationResult,
            })
                .then(function () {
                return client.mutate({
                    mutation: mutation,
                    resultBehaviors: [
                        {
                            type: 'CUSTOM_MUTATION_RESULT',
                            dataId: 'Todo3',
                            field: 'text',
                            value: 'this is the new text',
                        },
                    ],
                });
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
    describe('array cleaning for DELETE behavior', function () {
        it('maintains reference on flat array', function () {
            var array = [1, 2, 3, 4, 5].map(function (x) { return ({ id: x }); });
            chai_1.assert.isTrue(mutationResults_1.cleanArray(array, 6) === array);
            chai_1.assert.isFalse(mutationResults_1.cleanArray(array, 3) === array);
        });
        it('works on nested array', function () {
            var array = [
                [1, 2, 3, 4, 5].map(function (x) { return ({ id: x }); }),
                [6, 7, 8, 9, 10].map(function (x) { return ({ id: x }); }),
            ];
            var cleaned = mutationResults_1.cleanArray(array, 5);
            chai_1.assert.equal(cleaned[0].length, 4);
            chai_1.assert.equal(cleaned[1].length, 5);
        });
        it('maintains reference on nested array', function () {
            var array = [
                [1, 2, 3, 4, 5].map(function (x) { return ({ id: x }); }),
                [6, 7, 8, 9, 10].map(function (x) { return ({ id: x }); }),
            ];
            chai_1.assert.isTrue(mutationResults_1.cleanArray(array, 11) === array);
            chai_1.assert.isFalse(mutationResults_1.cleanArray(array, 5) === array);
        });
    });
    describe('result reducer', function () {
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
        var query2 = (_b = ["\n      query newTodos {\n        __typename\n        newTodos(since: 1){\n          __typename\n          id\n          text\n          completed\n        }\n      }\n    "], _b.raw = ["\n      query newTodos {\n        __typename\n        newTodos(since: 1){\n          __typename\n          id\n          text\n          completed\n        }\n      }\n    "], graphql_tag_1.default(_b));
        var result2 = {
            data: {
                __typename: 'Query',
                newTodos: [
                    {
                        __typename: 'Todo',
                        id: '3030',
                        text: 'Recently added',
                        completed: false,
                    },
                ],
            },
        };
        it('is called on mutation result', function () {
            var counter = 0;
            var observableQuery;
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
                return client.mutate({
                    mutation: mutation,
                });
            })
                .then(function () {
                return client.query({ query: query });
            })
                .then(function (newResult) {
                observableQuery.unsubscribe();
                chai_1.assert.equal(counter, 1);
                chai_1.assert.equal(newResult.data.todoList.todos.length, 4);
                chai_1.assert.equal(newResult.data.todoList.todos[0].text, 'This one was created with a mutation.');
            });
        });
        it('can filter based on operationName', function () {
            var counter = 0;
            var observableQuery;
            var observableQuery2;
            return setup({
                request: { query: mutation },
                result: mutationResult,
            })
                .then(function () {
                observableQuery = client.watchQuery({
                    query: query,
                    reducer: function (previousResult, action) {
                        if (actions_1.isMutationResultAction(action) && action.operationName === 'createTodo') {
                            counter++;
                            var newResult = lodash_1.cloneDeep(previousResult);
                            newResult.todoList.todos.unshift(action.result.data.createTodo);
                            return newResult;
                        }
                        return previousResult;
                    },
                }).subscribe({
                    next: function () { return null; },
                });
                observableQuery2 = client.watchQuery({
                    query: query,
                    reducer: function (previousResult, action) {
                        if (actions_1.isMutationResultAction(action) && action.operationName === 'wrongName') {
                            counter++;
                            var newResult = lodash_1.cloneDeep(previousResult);
                            newResult.todoList.todos.unshift(action.result.data.createTodo);
                            return newResult;
                        }
                        return previousResult;
                    },
                }).subscribe({
                    next: function () { return null; },
                });
                return client.mutate({
                    mutation: mutation,
                });
            })
                .then(function () {
                return client.query({ query: query });
            })
                .then(function (newResult) {
                observableQuery.unsubscribe();
                chai_1.assert.equal(counter, 1);
                chai_1.assert.equal(newResult.data.todoList.todos.length, 4);
                chai_1.assert.equal(newResult.data.todoList.todos[0].text, 'This one was created with a mutation.');
            });
        });
        it('is called on query result as well', function () {
            var counter = 0;
            var observableQuery;
            return setup({
                request: { query: mutation },
                result: mutationResult,
            }, {
                request: { query: query2 },
                result: result2,
            })
                .then(function () {
                observableQuery = client.watchQuery({
                    query: query,
                    reducer: function (previousResult, action) {
                        counter++;
                        if (actions_1.isQueryResultAction(action)) {
                            var newResult = lodash_1.cloneDeep(previousResult);
                            newResult.todoList.todos.unshift(action.result.data.newTodos[0]);
                            return newResult;
                        }
                        return previousResult;
                    },
                }).subscribe({
                    next: function () { return null; },
                });
            })
                .then(function () {
                return client.query({ query: query2 });
            })
                .then(function () {
                return client.query({ query: query });
            })
                .then(function (newResult) {
                observableQuery.unsubscribe();
                chai_1.assert.equal(counter, 1);
                chai_1.assert.equal(newResult.data.todoList.todos.length, 4);
                chai_1.assert.equal(newResult.data.todoList.todos[0].text, 'Recently added');
            });
        });
        it('runs multiple reducers', function () {
            var counter = 0;
            var counter2 = 0;
            var observableQuery;
            var observableQuery2;
            var filteredQuery = (_a = ["\n        query filteredQuery {\n          __typename\n          todoList(id: 5){\n            id\n            __typename\n            filteredTodos: todos(completed: true) {\n              __typename\n              id\n              text\n              completed\n            }\n          }\n        }\n      "], _a.raw = ["\n        query filteredQuery {\n          __typename\n          todoList(id: 5){\n            id\n            __typename\n            filteredTodos: todos(completed: true) {\n              __typename\n              id\n              text\n              completed\n            }\n          }\n        }\n      "], graphql_tag_1.default(_a));
            var filteredResponse = {
                data: {
                    __typename: 'Query',
                    todoList: {
                        __typename: 'TodoList',
                        id: 5,
                        filteredTodos: [{
                                id: 1,
                                __typename: 'Todo',
                                text: 'filtered todo',
                                completed: true,
                            }],
                    },
                },
            };
            return setup({
                request: { query: mutation },
                result: mutationResult,
            }, {
                request: { query: query2 },
                result: result2,
            }, {
                request: { query: filteredQuery },
                result: filteredResponse,
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
                observableQuery2 = client.watchQuery({
                    query: filteredQuery,
                    forceFetch: true,
                    reducer: function (previousResult, action) {
                        counter2++;
                        if (actions_1.isMutationResultAction(action) && action.result.data.createTodo.completed) {
                            var newResult = lodash_1.cloneDeep(previousResult);
                            newResult.todoList.filteredTodos.unshift(action.result.data.createTodo);
                            return newResult;
                        }
                        return previousResult;
                    },
                }).subscribe({
                    next: function () { return null; },
                });
            })
                .then(function () {
                return client.mutate({
                    mutation: mutation,
                });
            })
                .then(function () {
                return client.query({ query: query });
            })
                .then(function (newResult) {
                observableQuery.unsubscribe();
                chai_1.assert.equal(counter, 2);
                chai_1.assert.equal(newResult.data.todoList.todos.length, 4);
                chai_1.assert.equal(newResult.data.todoList.todos[0].text, 'This one was created with a mutation.');
            })
                .then(function () {
                return client.query({ query: filteredQuery });
            })
                .then(function (newResult) {
                observableQuery2.unsubscribe();
                chai_1.assert.equal(counter2, 2);
                chai_1.assert.equal(newResult.data.todoList.filteredTodos.length, 2);
                chai_1.assert.equal(newResult.data.todoList.filteredTodos[0].text, 'This one was created with a mutation.');
            });
            var _a;
        });
        it('does not fail if the query is still loading', function () {
            function setupReducerObsHandle() {
                var mockedResponses = [];
                for (var _i = 0; _i < arguments.length; _i++) {
                    mockedResponses[_i - 0] = arguments[_i];
                }
                networkInterface = src_1.mockNetworkInterface.apply(void 0, [{
                    request: { query: query },
                    result: result,
                    delay: 30,
                }].concat(mockedResponses));
                client = new apollo_client_1.default({
                    networkInterface: networkInterface,
                    addTypename: true,
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
                return client.watchQuery({
                    query: query,
                    reducer: function (state, action) {
                        if (actions_1.isMutationResultAction(action)) {
                            chai_1.assert.deepEqual(state, {});
                        }
                        return state;
                    },
                });
            }
            var obsHandle = setupReducerObsHandle({
                request: { query: mutation },
                result: mutationResult,
            });
            var subs = obsHandle.subscribe({
                next: function () { return null; },
            });
            return client.mutate({
                mutation: mutation,
            }).then(function (res) {
                subs.unsubscribe();
            });
        });
        var _a, _b;
    });
    describe('query result reducers', function () {
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
        it('analogous of ARRAY_INSERT', function () {
            return setup({
                request: { query: mutation },
                result: mutationResult,
            })
                .then(function () {
                return client.mutate({
                    mutation: mutation,
                    updateQueries: {
                        todoList: function (prev, options) {
                            var mResult = options.mutationResult;
                            chai_1.assert.equal(mResult.data.createTodo.id, '99');
                            chai_1.assert.equal(mResult.data.createTodo.text, 'This one was created with a mutation.');
                            var state = lodash_1.cloneDeep(prev);
                            state.todoList.todos.unshift(mResult.data.createTodo);
                            return state;
                        },
                    },
                });
            })
                .then(function () {
                return client.query({ query: query });
            })
                .then(function (newResult) {
                chai_1.assert.equal(newResult.data.todoList.todos.length, 4);
                chai_1.assert.equal(newResult.data.todoList.todos[0].text, 'This one was created with a mutation.');
            });
        });
        it('does not fail if the query did not complete correctly', function () {
            var obsHandle = setupObsHandle({
                request: { query: mutation },
                result: mutationResult,
            });
            var subs = obsHandle.subscribe({
                next: function () { return null; },
            });
            subs.unsubscribe();
            return client.mutate({
                mutation: mutation,
                updateQueries: {
                    todoList: function (prev, options) {
                        var mResult = options.mutationResult;
                        chai_1.assert.equal(mResult.data.createTodo.id, '99');
                        chai_1.assert.equal(mResult.data.createTodo.text, 'This one was created with a mutation.');
                        var state = lodash_1.cloneDeep(prev);
                        state.todoList.todos.unshift(mResult.data.createTodo);
                        return state;
                    },
                },
            });
        });
        it('does not make next queries fail if a mutation fails', function (done) {
            var obsHandle = setupObsHandle({
                request: { query: mutation },
                result: { errors: [new Error('mock error')] },
            }, {
                request: { query: query },
                result: result,
            });
            obsHandle.subscribe({
                next: function (obj) {
                    client.mutate({
                        mutation: mutation,
                        updateQueries: {
                            todoList: function (prev, options) {
                                var mResult = options.mutationResult;
                                var state = lodash_1.cloneDeep(prev);
                                state.todoList.todos.unshift(mResult.data && mResult.data.createTodo);
                                return state;
                            },
                        },
                    })
                        .then(function () { return done(new Error('Mutation should have failed')); }, function () { return client.mutate({
                        mutation: mutation,
                        updateQueries: {
                            todoList: function (prev, options) {
                                var mResult = options.mutationResult;
                                var state = lodash_1.cloneDeep(prev);
                                state.todoList.todos.unshift(mResult.data.createTodo);
                                return state;
                            },
                        },
                    }); })
                        .then(function () { return done(new Error('Mutation should have failed')); }, function () { return obsHandle.refetch(); })
                        .then(function () { return done(); }, done);
                },
            });
        });
        it('error handling in reducer functions', function () {
            var oldError = console.error;
            var errors = [];
            console.error = function (msg) {
                errors.push(msg);
            };
            return setup({
                request: { query: mutation },
                result: mutationResult,
            })
                .then(function () {
                return client.mutate({
                    mutation: mutation,
                    updateQueries: {
                        todoList: function (prev, options) {
                            throw new Error("Hello... It's me.");
                        },
                    },
                });
            })
                .then(function () {
                chai_1.assert.lengthOf(errors, 1);
                chai_1.assert.equal(errors[0].message, "Hello... It's me.");
                console.error = oldError;
            });
        });
        var _a;
    });
    it('does not fail if one of the previous queries did not complete correctly', function (done) {
        var variableQuery = (_a = ["\n      query Echo($message: String) {\n        echo(message: $message)\n      }\n    "], _a.raw = ["\n      query Echo($message: String) {\n        echo(message: $message)\n      }\n    "], graphql_tag_1.default(_a));
        var variables1 = {
            message: 'a',
        };
        var result1 = {
            data: {
                echo: 'a',
            },
        };
        var variables2 = {
            message: 'b',
        };
        var result2 = {
            data: {
                echo: 'b',
            },
        };
        var resetMutation = (_b = ["\n      mutation Reset {\n        reset {\n          echo\n        }\n      }\n    "], _b.raw = ["\n      mutation Reset {\n        reset {\n          echo\n        }\n      }\n    "], graphql_tag_1.default(_b));
        var resetMutationResult = {
            data: {
                reset: {
                    echo: '0',
                },
            },
        };
        networkInterface = src_1.mockNetworkInterface({
            request: { query: variableQuery, variables: variables1 },
            result: result1,
        }, {
            request: { query: variableQuery, variables: variables2 },
            result: result2,
        }, {
            request: { query: resetMutation },
            result: resetMutationResult,
        });
        client = new apollo_client_1.default({
            networkInterface: networkInterface,
            addTypename: false,
        });
        var watchedQuery = client.watchQuery({
            query: variableQuery,
            variables: variables1,
            returnPartialData: false,
        });
        var firstSubs = watchedQuery.subscribe({
            next: function () { return null; },
            error: done,
        });
        firstSubs.unsubscribe();
        var yieldCount = 0;
        watchedQuery.subscribe({
            next: function (_a) {
                var data = _a.data;
                yieldCount += 1;
                if (yieldCount === 1) {
                    chai_1.assert.equal(data.echo, 'b');
                    client.mutate({
                        mutation: resetMutation,
                        updateQueries: {
                            Echo: function (prev, options) {
                                return { echo: '0' };
                            },
                        },
                    });
                }
                else if (yieldCount === 2) {
                    chai_1.assert.equal(data.echo, '0');
                    done();
                }
            },
            error: function () {
            },
        });
        watchedQuery.refetch(variables2);
        var _a, _b;
    });
    var _a;
});
//# sourceMappingURL=mutationResults.js.map