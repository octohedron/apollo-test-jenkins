import { ModifiableWatchQueryOptions, WatchQueryOptions, FetchMoreQueryOptions, SubscribeToMoreOptions } from './watchQueryOptions';
import { Observable } from '../util/Observable';
import { QueryScheduler } from '../scheduler/scheduler';
import { ApolloError } from '../errors/ApolloError';
import { ApolloQueryResult } from './QueryManager';
import { NetworkStatus } from '../queries/store';
export declare type ApolloCurrentResult = {
    data: any;
    loading: boolean;
    networkStatus: NetworkStatus;
    error?: ApolloError;
};
export interface FetchMoreOptions {
    updateQuery: (previousQueryResult: Object, options: {
        fetchMoreResult: Object;
        queryVariables: Object;
    }) => Object;
}
export interface UpdateQueryOptions {
    variables: Object;
}
export declare class ObservableQuery extends Observable<ApolloQueryResult> {
    options: WatchQueryOptions;
    queryId: string;
    variables: {
        [key: string]: any;
    };
    private isCurrentlyPolling;
    private shouldSubscribe;
    private scheduler;
    private queryManager;
    private observers;
    private subscriptionHandles;
    private lastResult;
    private lastError;
    constructor({scheduler, options, shouldSubscribe}: {
        scheduler: QueryScheduler;
        options: WatchQueryOptions;
        shouldSubscribe?: boolean;
    });
    result(): Promise<ApolloQueryResult>;
    currentResult(): ApolloCurrentResult;
    refetch(variables?: any): Promise<ApolloQueryResult>;
    fetchMore(fetchMoreOptions: FetchMoreQueryOptions & FetchMoreOptions): Promise<ApolloQueryResult>;
    subscribeToMore(options: SubscribeToMoreOptions): () => void;
    setOptions(opts: ModifiableWatchQueryOptions): Promise<ApolloQueryResult>;
    setVariables(variables: any): Promise<ApolloQueryResult>;
    updateQuery(mapFn: (previousQueryResult: any, options: UpdateQueryOptions) => any): void;
    stopPolling(): void;
    startPolling(pollInterval: number): void;
    private onSubscribe(observer);
    private setUpQuery();
    private tearDownQuery();
}
