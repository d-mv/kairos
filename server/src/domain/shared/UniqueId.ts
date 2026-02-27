import { ValueObject } from "./ValueObject.js";

interface UniqueIdProps {
  value: string;
}

export class UniqueId extends ValueObject<UniqueIdProps> {
  constructor(id?: string) {
    super({ value: id ?? crypto.randomUUID() });
  }

  get value(): string {
    return this.props.value;
  }

  toString(): string {
    return this.props.value;
  }
}
