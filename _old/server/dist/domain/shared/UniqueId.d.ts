import { ValueObject } from "./ValueObject.js";
interface UniqueIdProps {
    value: string;
}
export declare class UniqueId extends ValueObject<UniqueIdProps> {
    constructor(id?: string);
    get value(): string;
    toString(): string;
}
export {};
//# sourceMappingURL=UniqueId.d.ts.map