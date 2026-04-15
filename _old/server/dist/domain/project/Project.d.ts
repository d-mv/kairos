import { Entity, Result } from "../shared/index.js";
interface ProjectProps {
    name: string;
    areaId: string | null;
    completedAt: Date | null;
    userId: string;
    createdAt: Date;
    updatedAt: Date;
}
export declare class Project extends Entity<ProjectProps> {
    private constructor();
    static create(name: string, userId: string, areaId?: string | null, id?: string): Result<Project, string>;
    static reconstitute(id: string, props: ProjectProps): Project;
    get name(): string;
    get areaId(): string | null;
    get userId(): string;
    get completedAt(): Date | null;
    get createdAt(): Date;
    get updatedAt(): Date;
    rename(newName: string): Result<void, string>;
    moveToArea(areaId: string | null): void;
    complete(completedAt?: Date): void;
    reopen(): void;
}
export {};
//# sourceMappingURL=Project.d.ts.map