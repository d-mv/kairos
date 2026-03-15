import type { BrainPageDTO } from "@kairos/shared";
import type { BrainPageRepository } from "../../domain/brain-page/index.js";
import { Result } from "../../domain/shared/index.js";
import { toBrainPageDTO } from "../mappers.js";

export class ListBrainPages {
  constructor(private readonly pageRepo: BrainPageRepository) {}

  async execute(userId: string): Promise<Result<BrainPageDTO[], string>> {
    const pages = await this.pageRepo.findAll(userId);
    return Result.ok(pages.map(toBrainPageDTO));
  }
}
