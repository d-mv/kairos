import type { LinkType, EntityType } from '@kairos/shared';
import { Entity, UniqueId, Result } from '../shared/index.js';
import { LinkCreated } from './LinkDomainEvents.js';

interface LinkProps {
  sourceId: string;
  sourceType: EntityType;
  targetId: string;
  targetType: EntityType;
  linkType: LinkType;
  userId: string;
  createdAt: Date;
}

const INVERSE: Record<LinkType, LinkType> = {
  blocks: 'blocked_by',
  blocked_by: 'blocks',
  related_to: 'related_to',
};

export class Link extends Entity<LinkProps> {
  private constructor(props: LinkProps, id?: UniqueId) {
    super(props, id);
  }

  static create(
    sourceId: string,
    sourceType: EntityType,
    targetId: string,
    targetType: EntityType,
    linkType: LinkType,
    userId: string,
    id?: string,
  ): Result<Link, string> {
    if (sourceId === targetId) {
      return Result.fail('A link cannot connect an entity to itself');
    }
    const link = new Link(
      { sourceId, sourceType, targetId, targetType, linkType, userId, createdAt: new Date() },
      id ? new UniqueId(id) : undefined,
    );
    link.addDomainEvent(new LinkCreated(link.id, sourceId, targetId, linkType));
    return Result.ok(link);
  }

  static reconstitute(id: string, props: LinkProps): Link {
    return new Link(props, new UniqueId(id));
  }

  get sourceId(): string { return this.props.sourceId; }
  get sourceType(): EntityType { return this.props.sourceType; }
  get targetId(): string { return this.props.targetId; }
  get targetType(): EntityType { return this.props.targetType; }
  get linkType(): LinkType { return this.props.linkType; }
  get userId(): string { return this.props.userId; }
  get createdAt(): Date { return this.props.createdAt; }

  /**
   * Creates a pair [forward, inverse] for a given link.
   * e.g. blocks → [blocks, blocked_by]
   */
  static createWithInverse(
    sourceId: string,
    sourceType: EntityType,
    targetId: string,
    targetType: EntityType,
    linkType: LinkType,
    userId: string,
  ): Result<[Link, Link], string> {
    const forwardResult = Link.create(sourceId, sourceType, targetId, targetType, linkType, userId);
    if (forwardResult.isErr) return Result.fail(forwardResult.error);

    const inverseLinkType = INVERSE[linkType];
    const inverseResult = Link.create(targetId, targetType, sourceId, sourceType, inverseLinkType, userId);
    if (inverseResult.isErr) return Result.fail(inverseResult.error);

    return Result.ok([forwardResult.value, inverseResult.value]);
  }
}
