import { Result } from "../../domain/shared/index.js";
import { toProjectDTO } from "../mappers.js";
export class UpdateProject {
    projectRepo;
    eventBus;
    constructor(projectRepo, eventBus) {
        this.projectRepo = projectRepo;
        this.eventBus = eventBus;
    }
    async execute(input) {
        const project = await this.projectRepo.findById(input.id, input.userId);
        if (!project)
            return Result.fail("Project not found");
        if (input.name !== undefined) {
            const result = project.rename(input.name);
            if (result.isErr)
                return Result.fail(result.error);
        }
        if ("areaId" in input) {
            if (project.userId !== input.userId) {
                return Result.fail("Shared projects cannot be moved into areas");
            }
            project.moveToArea(input.areaId ?? null);
        }
        if ("completedAt" in input) {
            if (input.completedAt) {
                project.complete(new Date(input.completedAt));
            }
            else {
                project.reopen();
            }
        }
        await this.projectRepo.save(project);
        await this.eventBus.publish(project.domainEvents);
        project.clearDomainEvents();
        return Result.ok(toProjectDTO(project));
    }
}
//# sourceMappingURL=UpdateProject.js.map