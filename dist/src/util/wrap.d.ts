/// <reference types="mocha" />
export declare const wrap: (done: MochaDone, cb: (...args: any[]) => any) => (...args: any[]) => any;
export declare function withWarning(func: Function, regex: RegExp): any;
