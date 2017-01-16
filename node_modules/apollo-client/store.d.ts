import { Middleware } from 'redux';
import { NormalizedCache } from './data/storeUtils';
import { QueryStore } from './queries/store';
import { MutationStore } from './mutations/store';
import { OptimisticStore } from './optimistic-data/store';
import { ApolloAction } from './actions';
import { IdGetter } from './data/extensions';
import { MutationBehaviorReducerMap } from './data/mutationResults';
import { CustomResolverMap } from './data/readFromStore';
export interface Store {
    data: NormalizedCache;
    queries: QueryStore;
    mutations: MutationStore;
    optimistic: OptimisticStore;
    reducerError: Error | null;
}
export interface ApolloStore {
    dispatch: (action: ApolloAction) => void;
    getState: () => any;
}
export declare type ApolloReducer = (store: NormalizedCache, action: ApolloAction) => NormalizedCache;
export declare function createApolloReducer(config: ApolloReducerConfig): Function;
export declare function createApolloStore({reduxRootKey, initialState, config, reportCrashes, logger}?: {
    reduxRootKey?: string;
    initialState?: any;
    config?: ApolloReducerConfig;
    reportCrashes?: boolean;
    logger?: Middleware;
}): ApolloStore;
export declare type ApolloReducerConfig = {
    dataIdFromObject?: IdGetter;
    mutationBehaviorReducers?: MutationBehaviorReducerMap;
    customResolvers?: CustomResolverMap;
};
export declare function getDataWithOptimisticResults(store: Store): NormalizedCache;
