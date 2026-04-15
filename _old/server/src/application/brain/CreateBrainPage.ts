import type { BrainContent, BrainPageDTO } from "@kairos/shared";
import type { BrainFolderRepository } from "../../domain/brain-folder/index.js";
import { BrainPage } from "../../domain/brain-page/index.js";
import type { BrainPageRepository } from "../../domain/brain-page/index.js";
import { Result } from "../../domain/shared/index.js";
import type { EventBus } from "../EventBus.js";
import { toBrainPageDTO } from "../mappers.js";

export interface CreateBrainPageInput {
  title: string;
  userId: string;
  folderId?: string | null;
  contentJson?: BrainContent;
}

export class CreateBrainPage {
  constructor(
    private readonly pageRepo: BrainPageRepository,
    private readonly folderRepo: BrainFolderRepository,
    private readonly eventBus: EventBus,
  ) {}

  async execute(input: CreateBrainPageInput): Promise<Result<BrainPageDTO, string>> {
    let pageUserId = input.userId;

    if (input.folderId) {
      const folder = await this.folderRepo.findById(input.folderId, input.userId);
      if (!folder) return Result.fail("Folder not found");
      pageUserId = folder.userId;
    }

    const result = BrainPage.create(input.title, pageUserId, {
      folderId: input.folderId ?? null,
      contentJson: input.contentJson,
    });
    if (result.isErr) return Result.fail(result.error);

    const page = result.value;
    await this.pageRepo.save(page);
    await this.eventBus.publish(page.domainEvents);
    page.clearDomainEvents();

    return Result.ok(toBrainPageDTO(page));
  }
}
