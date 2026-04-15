import { Project } from "../../domain/project/index.js";
import { Result } from "../../domain/shared/index.js";
import { toProjectDTO } from "../mappers.js";
export class CreateProject {
    projectRepo;
    eventBus;
    constructor(projectRepo, eventBus) {
        this.projectRepo = projectRepo;
        this.eventBus = eventBus;
    }
    async execute(input) {
        const result = Project.create(input.name, input.userId, input.areaId ?? null);
        if (result.isErr)
            return Result.fail(result.error);
        const project = result.value;
        await this.projectRepo.save(project);
        await this.eventBus.publish(project.domainEvents);
        project.clearDomainEvents();
        return Result.ok(toProjectDTO(project));
    }
}
//# sourceMappingURL=CreateProject.js.map