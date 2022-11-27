"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SerialExecutor = void 0;
const PromiseCallback_1 = require("./PromiseCallback");
const SerialJob_1 = require("./SerialJob");
class SerialExecutor {
    constructor() {
        this._jobs = [];
        this._executing = false;
    }
    execute(jobFunc, type) {
        return new Promise((resolve, reject) => {
            this._jobs.push(new SerialJob_1.SerialJob(jobFunc, new PromiseCallback_1.PromiseCallback(resolve, reject), type));
            this._executeNextJob();
        });
    }
    /**
     * @param type: if type is undefined, clear all jobs in queue
     */
    clear(type) {
        this._jobs = this._jobs.filter((job) => {
            if (!type) {
                return false;
            }
            else {
                return job.type !== type;
            }
        });
    }
    _executeNextJob() {
        if (this._executing) {
            return;
        }
        const job = this._jobs.shift();
        if (!job) {
            return;
        }
        this._executing = true;
        return job
            .func()
            .then((res) => {
            job.promiseCallback.resolve(res);
        })
            .catch((e) => {
            job.promiseCallback.reject(e);
        })
            .finally(() => {
            this._executing = false;
            this._executeNextJob();
        });
    }
}
exports.SerialExecutor = SerialExecutor;
//# sourceMappingURL=SerialExecutor.js.map