import { Entity, Result, UniqueId } from "../shared/index.js";

interface BrainFolderProps {
  name: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

export class BrainFolder extends Entity<BrainFolderProps> {
  private constructor(props: BrainFolderProps, id?: UniqueId) {
    super(props, id);
  }

  static create(name: string, userId: string, id?: string): Result<BrainFolder, string> {
    const trimmed = name.trim();
    if (trimmed.length === 0) return Result.fail("Folder name cannot be empty");

    return Result.ok(
      new BrainFolder(
        { name: trimmed, userId, createdAt: new Date(), updatedAt: new Date() },
        id ? new UniqueId(id) : undefined,
      ),
    );
  }

  static reconstitute(id: string, props: BrainFolderProps): BrainFolder {
    return new BrainFolder(props, new UniqueId(id));
  }

  get name(): string {
    return this.props.name;
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

  rename(name: string): Result<void, string> {
    const trimmed = name.trim();
    if (trimmed.length === 0) return Result.fail("Folder name cannot be empty");
    this.props.name = trimmed;
    this.props.updatedAt = new Date();
    return Result.ok(undefined);
  }
}
