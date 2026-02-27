import { Entity, UniqueId, Result } from '../shared/index.js';
import { AreaCreated, AreaRenamed } from './AreaDomainEvents.js';

interface AreaProps {
  name: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

export class Area extends Entity<AreaProps> {
  private constructor(props: AreaProps, id?: UniqueId) {
    super(props, id);
  }

  static create(name: string, userId: string, id?: string): Result<Area, string> {
    const trimmed = name.trim();
    if (trimmed.length === 0) {
      return Result.fail('Area name cannot be empty');
    }
    const area = new Area(
      { name: trimmed, userId, createdAt: new Date(), updatedAt: new Date() },
      id ? new UniqueId(id) : undefined,
    );
    area.addDomainEvent(new AreaCreated(area.id, trimmed, userId));
    return Result.ok(area);
  }

  static reconstitute(id: string, props: AreaProps): Area {
    return new Area(props, new UniqueId(id));
  }

  get name(): string { return this.props.name; }
  get userId(): string { return this.props.userId; }
  get createdAt(): Date { return this.props.createdAt; }
  get updatedAt(): Date { return this.props.updatedAt; }

  rename(newName: string): Result<void, string> {
    const trimmed = newName.trim();
    if (trimmed.length === 0) {
      return Result.fail('Area name cannot be empty');
    }
    const oldName = this.props.name;
    this.props.name = trimmed;
    this.props.updatedAt = new Date();
    this.addDomainEvent(new AreaRenamed(this.id, oldName, trimmed));
    return Result.ok(undefined);
  }
}
