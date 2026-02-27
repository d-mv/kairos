import { describe, it, expect } from 'vitest';
import { Link } from '../Link.js';
import { LinkCreated } from '../LinkDomainEvents.js';

describe('Link', () => {
  describe('create', () => {
    it('creates a valid link', () => {
      const result = Link.create('task-1', 'task', 'task-2', 'task', 'blocks', 'user-1');
      expect(result.isOk).toBe(true);
      const link = result.value;
      expect(link.sourceId).toBe('task-1');
      expect(link.targetId).toBe('task-2');
      expect(link.linkType).toBe('blocks');
    });

    it('forbids self-links', () => {
      const result = Link.create('task-1', 'task', 'task-1', 'task', 'blocks', 'user-1');
      expect(result.isErr).toBe(true);
      expect(result.error).toMatch(/itself/);
    });

    it('emits LinkCreated event', () => {
      const link = Link.create('a', 'task', 'b', 'task', 'related_to', 'u').value;
      expect(link.domainEvents).toHaveLength(1);
      expect(link.domainEvents[0]).toBeInstanceOf(LinkCreated);
    });

    it('allows task ↔ project links', () => {
      const result = Link.create('task-1', 'task', 'proj-1', 'project', 'related_to', 'u');
      expect(result.isOk).toBe(true);
    });
  });

  describe('createWithInverse', () => {
    it('creates blocks + blocked_by pair', () => {
      const result = Link.createWithInverse('a', 'task', 'b', 'task', 'blocks', 'u');
      expect(result.isOk).toBe(true);
      const [forward, inverse] = result.value;
      expect(forward.linkType).toBe('blocks');
      expect(forward.sourceId).toBe('a');
      expect(inverse.linkType).toBe('blocked_by');
      expect(inverse.sourceId).toBe('b');
      expect(inverse.targetId).toBe('a');
    });

    it('creates blocked_by + blocks pair', () => {
      const result = Link.createWithInverse('a', 'task', 'b', 'task', 'blocked_by', 'u');
      expect(result.isOk).toBe(true);
      const [forward, inverse] = result.value;
      expect(forward.linkType).toBe('blocked_by');
      expect(inverse.linkType).toBe('blocks');
    });

    it('creates related_to + related_to pair (symmetric)', () => {
      const result = Link.createWithInverse('a', 'task', 'b', 'task', 'related_to', 'u');
      expect(result.isOk).toBe(true);
      const [forward, inverse] = result.value;
      expect(forward.linkType).toBe('related_to');
      expect(inverse.linkType).toBe('related_to');
    });

    it('rejects self-link pair', () => {
      const result = Link.createWithInverse('a', 'task', 'a', 'task', 'blocks', 'u');
      expect(result.isErr).toBe(true);
    });
  });
});
