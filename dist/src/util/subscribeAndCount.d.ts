/// <reference types="mocha" />
import { ObservableQuery } from 'apollo-client/core/ObservableQuery';
import { ApolloQueryResult } from 'apollo-client/core/QueryManager';
import { Subscription } from 'apollo-client/util/Observable';
export declare function subscribeAndCount(done: MochaDone, observable: ObservableQuery, cb: (handleCount: number, result: ApolloQueryResult) => any): Subscription;
