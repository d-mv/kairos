import type { Area } from "./Area.js";
export interface AreaRepository {
    findById(id: string, userId: string): Promise<Area | null>;
    findAll(userId: string): Promise<Area[]>;
    save(area: Area): Promise<void>;
    delete(id: string, userId: string): Promise<void>;
}
//# sourceMappingURL=AreaRepository.d.ts.map