import type { BrainPageRepository } from "../../domain/brain-page/index.js";
import { Result } from "../../domain/shared/index.js";

export interface DeleteBrainPageInput {
  id: string;
  userId: string;
}

export class DeleteBrainPage {
  constructor(private readonly pageRepo: BrainPageRepository) {}

  async execute(input: DeleteBrainPageInput): Promise<Result<void, string>> {
    const page = await this.pageRepo.findById(input.id, input.userId);
    if (!page) return Result.fail("Page not found");

    await this.pageRepo.delete(input.id, input.userId);
    return Result.ok(undefined);
  }
}
