import type { LinkRepository } from '../../domain/link/index.js';
import { LinkDeleted } from '../../domain/link/index.js';
import { Result } from '../../domain/shared/index.js';
import type { EventBus } from '../EventBus.js';

export class DeleteLink {
  constructor(
    private readonly linkRepo: LinkRepository,
    private readonly eventBus: EventBus,
  ) {}

  async execute(id: string, userId: string): Promise<Result<void, string>> {
    const link = await this.linkRepo.findById(id, userId);
    if (!link) return Result.fail('Link not found');

    await this.linkRepo.delete(id, userId);
    await this.eventBus.publish([new LinkDeleted(id)]);
    return Result.ok(undefined);
  }
}
