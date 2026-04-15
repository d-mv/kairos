export declare abstract class ValueObject<T extends object> {
    protected readonly props: T;
    constructor(props: T);
    equals(other?: ValueObject<T>): boolean;
}
//# sourceMappingURL=ValueObject.d.ts.map