"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PromiseCallback = void 0;
class PromiseCallback {
    constructor(resolve, reject, timeoutId) {
        this._resolve = resolve;
        this._reject = reject;
        this._timeoutId = timeoutId;
    }
    resolve(val) {
        this._resolve(val);
        this._invalidateTimeout();
    }
    reject(error) {
        this._reject(error);
        this._invalidateTimeout();
    }
    _invalidateTimeout() {
        if (this._timeoutId === undefined) {
            return;
        }
        clearTimeout(this._timeoutId);
        this._timeoutId = undefined;
    }
}
exports.PromiseCallback = PromiseCallback;
//# sourceMappingURL=PromiseCallback.js.map