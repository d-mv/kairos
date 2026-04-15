export class Result {
    _isOk;
    _value;
    _error;
    constructor(isOk, value, error) {
        this._isOk = isOk;
        this._value = value;
        this._error = error;
    }
    static ok(value) {
        return new Result(true, value);
    }
    static fail(error) {
        return new Result(false, undefined, error);
    }
    get isOk() {
        return this._isOk;
    }
    get isErr() {
        return !this._isOk;
    }
    get value() {
        if (!this._isOk) {
            throw new Error("Cannot get value from a failed Result");
        }
        return this._value;
    }
    get error() {
        if (this._isOk) {
            throw new Error("Cannot get error from a successful Result");
        }
        return this._error;
    }
    map(fn) {
        if (this._isOk) {
            return Result.ok(fn(this._value));
        }
        return Result.fail(this._error);
    }
    flatMap(fn) {
        if (this._isOk) {
            return fn(this._value);
        }
        return Result.fail(this._error);
    }
}
//# sourceMappingURL=Result.js.map