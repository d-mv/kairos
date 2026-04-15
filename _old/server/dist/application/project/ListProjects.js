import { Result } from "../../domain/shared/index.js";
import { toProjectDTO } from "../mappers.js";
export class ListProjects {
    projectRepo;
    constructor(projectRepo) {
        this.projectRepo = projectRepo;
    }
    async execute(userId) {
        const projects = await this.projectRepo.findAll(userId);
        return Result.ok(projects.map(toProjectDTO));
    }
}
//# sourceMappingURL=ListProjects.js.map