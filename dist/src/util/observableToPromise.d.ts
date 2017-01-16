/// <reference types="node" />
import { ObservableQuery } from 'apollo-client/core/ObservableQuery';
import { ApolloQueryResult } from 'apollo-client/core/QueryManager';
import { Subscription } from 'apollo-client/util/Observable';
export declare type Options = {
    observable: ObservableQuery;
    shouldResolve?: boolean;
    wait?: number;
    errorCallbacks?: ((error: Error) => any)[];
};
export declare type ResultCallback = ((result: ApolloQueryResult) => any);
export declare function observableToPromiseAndSubscription({observable, shouldResolve, wait, errorCallbacks}: Options, ...cbs: ResultCallback[]): {
    promise: Promise<any[]>;
    subscription: Subscription;
};
export declare function observableToPromise(options: Options, ...cbs: ResultCallback[]): Promise<any[]>;
