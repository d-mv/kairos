import { Entity, Result } from "../shared/index.js";
interface AreaProps {
    name: string;
    userId: string;
    createdAt: Date;
    updatedAt: Date;
}
export declare class Area extends Entity<AreaProps> {
    private constructor();
    static create(name: string, userId: string, id?: string): Result<Area, string>;
    static reconstitute(id: string, props: AreaProps): Area;
    get name(): string;
    get userId(): string;
    get createdAt(): Date;
    get updatedAt(): Date;
    rename(newName: string): Result<void, string>;
}
export {};
//# sourceMappingURL=Area.d.ts.map