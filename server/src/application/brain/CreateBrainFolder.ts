import type { BrainFolderDTO } from "@kairos/shared";
import { BrainFolder } from "../../domain/brain-folder/index.js";
import type { BrainFolderRepository } from "../../domain/brain-folder/index.js";
import { Result } from "../../domain/shared/index.js";
import type { EventBus } from "../EventBus.js";
import { toBrainFolderDTO } from "../mappers.js";

export interface CreateBrainFolderInput {
  name: string;
  userId: string;
}

export class CreateBrainFolder {
  constructor(
    private readonly folderRepo: BrainFolderRepository,
    private readonly eventBus: EventBus,
  ) {}

  async execute(input: CreateBrainFolderInput): Promise<Result<BrainFolderDTO, string>> {
    const result = BrainFolder.create(input.name, input.userId);
    if (result.isErr) return Result.fail(result.error);

    const folder = result.value;
    await this.folderRepo.save(folder);
    await this.eventBus.publish(folder.domainEvents);
    folder.clearDomainEvents();

    return Result.ok(toBrainFolderDTO(folder));
  }
}
