import type { BrainFolderDTO } from "@kairos/shared";
import type { BrainFolderRepository } from "../../domain/brain-folder/index.js";
import { Result } from "../../domain/shared/index.js";
import { toBrainFolderDTO } from "../mappers.js";

export class ListBrainFolders {
  constructor(private readonly folderRepo: BrainFolderRepository) {}

  async execute(userId: string): Promise<Result<BrainFolderDTO[], string>> {
    const folders = await this.folderRepo.findAll(userId);
    return Result.ok(folders.map(toBrainFolderDTO));
  }
}
