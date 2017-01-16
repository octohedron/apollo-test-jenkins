/// <reference types="isomorphic-fetch" />
/// <reference types="chai" />
export interface MockedIResponse {
    json(): Promise<JSON>;
}
export interface MockedFetchResponse {
    url: string;
    opts: RequestInit;
    result: MockedIResponse;
    delay?: number;
}
export declare function createMockedIResponse(result: Object): MockedIResponse;
export declare class MockFetch {
    private mockedResponsesByKey;
    constructor(...mockedResponses: MockedFetchResponse[]);
    addMockedResponse(mockedResponse: MockedFetchResponse): void;
    fetch(url: string, opts: RequestInit): Promise<{}>;
    fetchParamsToKey(url: string, opts: RequestInit): string;
    getFetch(): any;
}
export declare function createMockFetch(...mockedResponses: MockedFetchResponse[]): any;
