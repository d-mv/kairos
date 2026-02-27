import type { AreaDTO } from "@kairos/shared";
import type { AreaRepository } from "../../domain/area/index.js";
import { Result } from "../../domain/shared/index.js";
import type { EventBus } from "../EventBus.js";
import { toAreaDTO } from "../mappers.js";

export interface UpdateAreaInput {
  id: string;
  userId: string;
  name: string;
}

export class UpdateArea {
  constructor(
    private readonly areaRepo: AreaRepository,
    private readonly eventBus: EventBus,
  ) {}

  async execute(input: UpdateAreaInput): Promise<Result<AreaDTO, string>> {
    const area = await this.areaRepo.findById(input.id, input.userId);
    if (!area) return Result.fail("Area not found");

    const result = area.rename(input.name);
    if (result.isErr) return Result.fail(result.error);

    await this.areaRepo.save(area);
    await this.eventBus.publish(area.domainEvents);
    area.clearDomainEvents();

    return Result.ok(toAreaDTO(area));
  }
}
