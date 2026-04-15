export declare class Result<T, E = string> {
    private readonly _isOk;
    private readonly _value;
    private readonly _error;
    private constructor();
    static ok<T, E = string>(value: T): Result<T, E>;
    static fail<T, E = string>(error: E): Result<T, E>;
    get isOk(): boolean;
    get isErr(): boolean;
    get value(): T;
    get error(): E;
    map<U>(fn: (value: T) => U): Result<U, E>;
    flatMap<U>(fn: (value: T) => Result<U, E>): Result<U, E>;
}
export type DomainError = string;
//# sourceMappingURL=Result.d.ts.map