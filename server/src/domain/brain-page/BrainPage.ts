import type { BrainContent } from "@kairos/shared";
import { Entity, Result, UniqueId } from "../shared/index.js";

interface BrainPageProps {
  title: string;
  folderId: string | null;
  contentJson: BrainContent;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

export class BrainPage extends Entity<BrainPageProps> {
  private constructor(props: BrainPageProps, id?: UniqueId) {
    super(props, id);
  }

  static create(
    title: string,
    userId: string,
    options?: { folderId?: string | null; contentJson?: BrainContent },
    id?: string,
  ): Result<BrainPage, string> {
    const trimmed = title.trim();
    if (trimmed.length === 0) return Result.fail("Page title cannot be empty");

    return Result.ok(
      new BrainPage(
        {
          title: trimmed,
          folderId: options?.folderId ?? null,
          contentJson: options?.contentJson ?? {},
          userId,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        id ? new UniqueId(id) : undefined,
      ),
    );
  }

  static reconstitute(id: string, props: BrainPageProps): BrainPage {
    return new BrainPage(props, new UniqueId(id));
  }

  get title(): string {
    return this.props.title;
  }

  get folderId(): string | null {
    return this.props.folderId;
  }

  get contentJson(): BrainContent {
    return this.props.contentJson;
  }

  get userId(): string {
    return this.props.userId;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  update(data: {
    title?: string;
    folderId?: string | null;
    contentJson?: BrainContent;
  }): Result<void, string> {
    if (data.title !== undefined) {
      const trimmed = data.title.trim();
      if (trimmed.length === 0) return Result.fail("Page title cannot be empty");
      this.props.title = trimmed;
    }

    if (data.folderId !== undefined) {
      this.props.folderId = data.folderId;
    }

    if (data.contentJson !== undefined) {
      this.props.contentJson = data.contentJson;
    }

    this.props.updatedAt = new Date();
    return Result.ok(undefined);
  }
}
