/// <reference types="node" />
export declare type PromiseResolveFunc = (val: any) => void;
export declare type PromiseRejectFunc = (error: Error) => void;
export declare class PromiseCallback {
    private readonly _resolve;
    private readonly _reject;
    private _timeoutId?;
    constructor(resolve: PromiseResolveFunc, reject: PromiseRejectFunc, timeoutId?: NodeJS.Timeout);
    resolve(val?: any): void;
    reject(error: Error): void;
    private _invalidateTimeout;
}
//# sourceMappingURL=PromiseCallback.d.ts.map