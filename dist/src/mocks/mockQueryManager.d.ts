import { QueryManager } from 'apollo-client/core/QueryManager';
import { MockedResponse } from './mockNetworkInterface';
export declare const mockQueryManager: (...mockedResponses: MockedResponse[]) => QueryManager;
