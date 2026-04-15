import { ProjectDeleted } from "../../domain/project/index.js";
import { Result } from "../../domain/shared/index.js";
export class DeleteProject {
    projectRepo;
    eventBus;
    constructor(projectRepo, eventBus) {
        this.projectRepo = projectRepo;
        this.eventBus = eventBus;
    }
    async execute(id, userId) {
        const project = await this.projectRepo.findById(id, userId);
        if (!project)
            return Result.fail("Project not found");
        await this.projectRepo.delete(id, userId);
        await this.eventBus.publish([new ProjectDeleted(id)]);
        return Result.ok(undefined);
    }
}
//# sourceMappingURL=DeleteProject.js.map