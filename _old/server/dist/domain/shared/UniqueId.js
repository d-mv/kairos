import { ValueObject } from "./ValueObject.js";
export class UniqueId extends ValueObject {
    constructor(id) {
        super({ value: id ?? crypto.randomUUID() });
    }
    get value() {
        return this.props.value;
    }
    toString() {
        return this.props.value;
    }
}
//# sourceMappingURL=UniqueId.js.map