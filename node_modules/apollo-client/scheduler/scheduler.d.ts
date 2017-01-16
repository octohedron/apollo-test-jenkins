import { QueryManager, QueryListener, FetchType } from '../core/QueryManager';
import { ObservableQuery } from '../core/ObservableQuery';
import { WatchQueryOptions } from '../core/watchQueryOptions';
export declare class QueryScheduler {
    inFlightQueries: {
        [queryId: string]: WatchQueryOptions;
    };
    registeredQueries: {
        [queryId: string]: WatchQueryOptions;
    };
    intervalQueries: {
        [interval: number]: string[];
    };
    queryManager: QueryManager;
    private pollingTimers;
    constructor({queryManager}: {
        queryManager: QueryManager;
    });
    checkInFlight(queryId: string): boolean;
    fetchQuery(queryId: string, options: WatchQueryOptions, fetchType: FetchType): Promise<{}>;
    startPollingQuery(options: WatchQueryOptions, queryId?: string, listener?: QueryListener): string;
    stopPollingQuery(queryId: string): void;
    fetchQueriesOnInterval(interval: number): void;
    addQueryOnInterval(queryId: string, queryOptions: WatchQueryOptions): void;
    registerPollingQuery(queryOptions: WatchQueryOptions): ObservableQuery;
}
