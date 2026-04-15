import { Entity, Result } from "../shared/index.js";
interface BrainFolderProps {
    name: string;
    userId: string;
    createdAt: Date;
    updatedAt: Date;
}
export declare class BrainFolder extends Entity<BrainFolderProps> {
    private constructor();
    static create(name: string, userId: string, id?: string): Result<BrainFolder, string>;
    static reconstitute(id: string, props: BrainFolderProps): BrainFolder;
    get name(): string;
    get userId(): string;
    get createdAt(): Date;
    get updatedAt(): Date;
    rename(name: string): Result<void, string>;
}
export {};
//# sourceMappingURL=BrainFolder.d.ts.map