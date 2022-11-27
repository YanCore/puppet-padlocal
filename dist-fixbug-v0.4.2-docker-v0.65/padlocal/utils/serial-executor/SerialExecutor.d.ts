import { SerialJobFunc } from "./SerialJob";
export declare class SerialExecutor {
    private _jobs;
    private _executing;
    constructor();
    execute<T>(jobFunc: SerialJobFunc, type?: string): Promise<T>;
    /**
     * @param type: if type is undefined, clear all jobs in queue
     */
    clear(type?: string): void;
    private _executeNextJob;
}
//# sourceMappingURL=SerialExecutor.d.ts.map