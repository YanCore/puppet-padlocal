import { PromiseCallback } from "./PromiseCallback";
export declare type SerialJobFunc = () => Promise<any>;
export declare class SerialJob {
    readonly type: string | undefined;
    readonly func: SerialJobFunc;
    readonly promiseCallback: PromiseCallback;
    constructor(func: SerialJobFunc, promiseCallback: PromiseCallback, type?: string);
}
//# sourceMappingURL=SerialJob.d.ts.map