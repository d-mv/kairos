import type { BrainContent, BrainPageDTO } from "@kairos/shared";
import type { BrainFolderRepository } from "../../domain/brain-folder/index.js";
import type { BrainPageRepository } from "../../domain/brain-page/index.js";
import { Result } from "../../domain/shared/index.js";
import type { EventBus } from "../EventBus.js";
import { toBrainPageDTO } from "../mappers.js";

export interface UpdateBrainPageInput {
  id: string;
  userId: string;
  title?: string;
  folderId?: string | null;
  contentJson?: BrainContent;
}

export class UpdateBrainPage {
  constructor(
    private readonly pageRepo: BrainPageRepository,
    private readonly folderRepo: BrainFolderRepository,
    private readonly eventBus: EventBus,
  ) {}

  async execute(input: UpdateBrainPageInput): Promise<Result<BrainPageDTO, string>> {
    const page = await this.pageRepo.findById(input.id, input.userId);
    if (!page) return Result.fail("Page not found");

    if (input.folderId) {
      const folder = await this.folderRepo.findById(input.folderId, input.userId);
      if (!folder) return Result.fail("Folder not found");
    }

    const result = page.update({
      title: input.title,
      folderId: input.folderId,
      contentJson: input.contentJson,
    });
    if (result.isErr) return Result.fail(result.error);

    await this.pageRepo.save(page);
    await this.eventBus.publish(page.domainEvents);
    page.clearDomainEvents();

    return Result.ok(toBrainPageDTO(page));
  }
}
