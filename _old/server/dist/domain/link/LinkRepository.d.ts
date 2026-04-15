import type { Link } from "./Link.js";
export interface LinkRepository {
    findById(id: string, userId: string): Promise<Link | null>;
    findBySourceId(sourceId: string, userId: string): Promise<Link[]>;
    findByTargetId(targetId: string, userId: string): Promise<Link[]>;
    findByEntityId(entityId: string, userId: string): Promise<Link[]>;
    save(link: Link): Promise<void>;
    delete(id: string, userId: string): Promise<void>;
}
//# sourceMappingURL=LinkRepository.d.ts.map