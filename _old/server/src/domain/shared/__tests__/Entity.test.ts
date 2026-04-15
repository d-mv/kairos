import { describe, it, expect } from "vitest";
import { Entity } from "../Entity.js";
import { UniqueId } from "../UniqueId.js";
import type { DomainEvent } from "../DomainEvent.js";

class TestEntity extends Entity<{ name: string }> {
  static create(name: string, id?: string) {
    return new TestEntity({ name }, id ? new UniqueId(id) : undefined);
  }

  get name() {
    return this.props.name;
  }

  triggerEvent(event: DomainEvent) {
    this.addDomainEvent(event);
  }
}

describe("Entity", () => {
  it("generates unique id when none provided", () => {
    const a = TestEntity.create("a");
    const b = TestEntity.create("b");
    expect(a.id).not.toBe(b.id);
  });

  it("uses provided id", () => {
    const e = TestEntity.create("test", "my-id");
    expect(e.id).toBe("my-id");
  });

  it("equality is based on id, not props", () => {
    const a = TestEntity.create("alice", "same-id");
    const b = TestEntity.create("bob", "same-id");
    expect(a.equals(b)).toBe(true);
  });

  it("not equal when different ids", () => {
    const a = TestEntity.create("alice", "id-1");
    const b = TestEntity.create("alice", "id-2");
    expect(a.equals(b)).toBe(false);
  });

  it("manages domain events", () => {
    const e = TestEntity.create("test", "id");
    const event: DomainEvent = {
      eventId: "1",
      occurredOn: new Date(),
      eventName: "TestEvent",
    };
    e.triggerEvent(event);
    expect(e.domainEvents).toHaveLength(1);
    e.clearDomainEvents();
    expect(e.domainEvents).toHaveLength(0);
  });
});
