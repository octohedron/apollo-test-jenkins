import { MockedResponse } from './mockNetworkInterface';
import { ObservableQuery } from 'apollo-client/core/ObservableQuery';
export declare const mockWatchQuery: (...mockedResponses: MockedResponse[]) => ObservableQuery;
