import type { AreaDTO } from "@kairos/shared";
import type { AreaRepository } from "../../domain/area/index.js";
import { Result } from "../../domain/shared/index.js";
import { toAreaDTO } from "../mappers.js";

export class ListAreas {
  constructor(private readonly areaRepo: AreaRepository) {}

  async execute(userId: string): Promise<Result<AreaDTO[], string>> {
    const areas = await this.areaRepo.findAll(userId);
    return Result.ok(areas.map(toAreaDTO));
  }
}
