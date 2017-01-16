import { NormalizedCache } from '../data/storeUtils';
export declare type OptimisticStore = {
    mutationId: string;
    data: NormalizedCache;
}[];
export declare function optimistic(previousState: any[], action: any, store: any, config: any): OptimisticStore;
