import type { AreaDTO, BrainFolderDTO, BrainPageDTO, LinkDTO, ProjectDTO, TaskDTO } from "@kairos/shared";
import type { Area } from "../domain/area/index.js";
import type { BrainFolder } from "../domain/brain-folder/index.js";
import type { BrainPage } from "../domain/brain-page/index.js";
import type { Project } from "../domain/project/index.js";
import type { Task } from "../domain/task/index.js";
import type { Link } from "../domain/link/index.js";
export declare function toAreaDTO(area: Area): AreaDTO;
export declare function toProjectDTO(project: Project): ProjectDTO;
export declare function toTaskDTO(task: Task): TaskDTO;
export declare function toLinkDTO(link: Link): LinkDTO;
export declare function toBrainFolderDTO(folder: BrainFolder): BrainFolderDTO;
export declare function toBrainPageDTO(page: BrainPage): BrainPageDTO;
//# sourceMappingURL=mappers.d.ts.map