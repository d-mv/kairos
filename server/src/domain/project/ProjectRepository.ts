import type { Project } from './Project.js';

export interface ProjectRepository {
  findById(id: string, userId: string): Promise<Project | null>;
  findAll(userId: string): Promise<Project[]>;
  findByAreaId(areaId: string, userId: string): Promise<Project[]>;
  save(project: Project): Promise<void>;
  delete(id: string, userId: string): Promise<void>;
}
