"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SerialJob = void 0;
class SerialJob {
    constructor(func, promiseCallback, type) {
        this.func = func;
        this.promiseCallback = promiseCallback;
        this.type = type;
    }
}
exports.SerialJob = SerialJob;
//# sourceMappingURL=SerialJob.js.map