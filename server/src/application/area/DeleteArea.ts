import type { AreaRepository } from "../../domain/area/index.js";
import { AreaDeleted } from "../../domain/area/index.js";
import { Result } from "../../domain/shared/index.js";
import type { EventBus } from "../EventBus.js";

export interface DeleteAreaInput {
  id: string;
  userId: string;
}

export class DeleteArea {
  constructor(
    private readonly areaRepo: AreaRepository,
    private readonly eventBus: EventBus,
  ) {}

  async execute(input: DeleteAreaInput): Promise<Result<void, string>> {
    const area = await this.areaRepo.findById(input.id, input.userId);
    if (!area) return Result.fail("Area not found");

    await this.areaRepo.delete(input.id, input.userId);
    await this.eventBus.publish([new AreaDeleted(input.id)]);

    return Result.ok(undefined);
  }
}
