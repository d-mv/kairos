import type { LinkDTO, LinkType, EntityType } from "@kairos/shared";
import { Link } from "../../domain/link/index.js";
import type { LinkRepository } from "../../domain/link/index.js";
import { Result } from "../../domain/shared/index.js";
import type { EventBus } from "../EventBus.js";
import { toLinkDTO } from "../mappers.js";

export interface CreateLinkInput {
  sourceId: string;
  sourceType: EntityType;
  targetId: string;
  targetType: EntityType;
  linkType: LinkType;
  userId: string;
}

export class CreateLink {
  constructor(
    private readonly linkRepo: LinkRepository,
    private readonly eventBus: EventBus,
  ) {}

  async execute(input: CreateLinkInput): Promise<Result<LinkDTO[], string>> {
    const result = Link.createWithInverse(
      input.sourceId,
      input.sourceType,
      input.targetId,
      input.targetType,
      input.linkType,
      input.userId,
    );
    if (result.isErr) return Result.fail(result.error);

    const [forward, inverse] = result.value;
    await this.linkRepo.save(forward);
    await this.linkRepo.save(inverse);

    const allEvents = [...forward.domainEvents, ...inverse.domainEvents];
    await this.eventBus.publish(allEvents);

    return Result.ok([toLinkDTO(forward), toLinkDTO(inverse)]);
  }
}
