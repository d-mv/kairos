import { describe, it, expect } from 'vitest';
import { Area } from '../Area.js';
import { AreaCreated, AreaRenamed } from '../AreaDomainEvents.js';

describe('Area', () => {
  describe('create', () => {
    it('creates an area with a name and userId', () => {
      const result = Area.create('Work', 'user-1');
      expect(result.isOk).toBe(true);
      const area = result.value;
      expect(area.name).toBe('Work');
      expect(area.userId).toBe('user-1');
      expect(area.id).toBeDefined();
    });

    it('trims whitespace from name', () => {
      const result = Area.create('  Home  ', 'user-1');
      expect(result.value.name).toBe('Home');
    });

    it('fails when name is empty', () => {
      const result = Area.create('', 'user-1');
      expect(result.isErr).toBe(true);
      expect(result.error).toBe('Area name cannot be empty');
    });

    it('fails when name is whitespace only', () => {
      const result = Area.create('   ', 'user-1');
      expect(result.isErr).toBe(true);
    });

    it('uses provided id', () => {
      const result = Area.create('Work', 'user-1', 'my-id');
      expect(result.value.id).toBe('my-id');
    });

    it('emits AreaCreated event', () => {
      const result = Area.create('Work', 'user-1');
      const area = result.value;
      expect(area.domainEvents).toHaveLength(1);
      expect(area.domainEvents[0]).toBeInstanceOf(AreaCreated);
      const event = area.domainEvents[0] as AreaCreated;
      expect(event.name).toBe('Work');
      expect(event.userId).toBe('user-1');
    });
  });

  describe('rename', () => {
    it('renames the area', () => {
      const area = Area.create('Work', 'user-1').value;
      area.clearDomainEvents();

      const result = area.rename('Personal');
      expect(result.isOk).toBe(true);
      expect(area.name).toBe('Personal');
    });

    it('emits AreaRenamed event', () => {
      const area = Area.create('Work', 'user-1').value;
      area.clearDomainEvents();
      area.rename('Personal');

      expect(area.domainEvents).toHaveLength(1);
      const event = area.domainEvents[0] as AreaRenamed;
      expect(event).toBeInstanceOf(AreaRenamed);
      expect(event.oldName).toBe('Work');
      expect(event.newName).toBe('Personal');
    });

    it('fails when new name is empty', () => {
      const area = Area.create('Work', 'user-1').value;
      const result = area.rename('');
      expect(result.isErr).toBe(true);
      expect(area.name).toBe('Work'); // unchanged
    });
  });

  describe('reconstitute', () => {
    it('restores area from persistence', () => {
      const now = new Date();
      const area = Area.reconstitute('existing-id', {
        name: 'Home',
        userId: 'user-1',
        createdAt: now,
        updatedAt: now,
      });
      expect(area.id).toBe('existing-id');
      expect(area.name).toBe('Home');
      expect(area.domainEvents).toHaveLength(0);
    });
  });
});
