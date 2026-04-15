import { Result } from "../../domain/shared/index.js";
import { toTaskDTO } from "../mappers.js";
export class ListTasks {
    taskRepo;
    constructor(taskRepo) {
        this.taskRepo = taskRepo;
    }
    async execute(input) {
        let tasks;
        if (input.projectId) {
            tasks = await this.taskRepo.findByProjectId(input.projectId, input.userId);
        }
        else if (input.areaId) {
            tasks = await this.taskRepo.findByAreaId(input.areaId, input.userId);
        }
        else if (input.inbox) {
            tasks = await this.taskRepo.findInbox(input.userId);
        }
        else if (input.parentTaskId) {
            tasks = await this.taskRepo.findSubtasks(input.parentTaskId, input.userId);
        }
        else {
            tasks = await this.taskRepo.findAll(input.userId);
        }
        return Result.ok(tasks.map(toTaskDTO));
    }
}
//# sourceMappingURL=ListTasks.js.map