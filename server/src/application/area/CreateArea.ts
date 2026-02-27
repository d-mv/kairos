import type { AreaDTO } from '@kairos/shared';
import { Area } from '../../domain/area/index.js';
import type { AreaRepository } from '../../domain/area/index.js';
import { Result } from '../../domain/shared/index.js';
import type { EventBus } from '../EventBus.js';
import { toAreaDTO } from '../mappers.js';

export interface CreateAreaInput {
  name: string;
  userId: string;
}

export class CreateArea {
  constructor(
    private readonly areaRepo: AreaRepository,
    private readonly eventBus: EventBus,
  ) {}

  async execute(input: CreateAreaInput): Promise<Result<AreaDTO, string>> {
    const result = Area.create(input.name, input.userId);
    if (result.isErr) return Result.fail(result.error);

    const area = result.value;
    await this.areaRepo.save(area);
    await this.eventBus.publish(area.domainEvents);
    area.clearDomainEvents();

    return Result.ok(toAreaDTO(area));
  }
}
