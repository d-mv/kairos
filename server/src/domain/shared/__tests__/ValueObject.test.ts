import { describe, it, expect } from 'vitest';
import { ValueObject } from '../ValueObject.js';

class Money extends ValueObject<{ amount: number; currency: string }> {
  constructor(amount: number, currency: string) {
    super({ amount, currency });
  }
  get amount() { return this.props.amount; }
  get currency() { return this.props.currency; }
}

describe('ValueObject', () => {
  it('equals when same props', () => {
    const a = new Money(10, 'USD');
    const b = new Money(10, 'USD');
    expect(a.equals(b)).toBe(true);
  });

  it('not equals when different props', () => {
    const a = new Money(10, 'USD');
    const b = new Money(20, 'USD');
    expect(a.equals(b)).toBe(false);
  });

  it('not equals with different currency', () => {
    const a = new Money(10, 'USD');
    const b = new Money(10, 'EUR');
    expect(a.equals(b)).toBe(false);
  });

  it('not equals when null', () => {
    const a = new Money(10, 'USD');
    expect(a.equals(undefined)).toBe(false);
  });

  it('props values are frozen (cannot mutate)', () => {
    const a = new Money(10, 'USD');
    expect(() => {
      (a as unknown as { props: { amount: number } }).props.amount = 99;
    }).toThrow();
  });
});
