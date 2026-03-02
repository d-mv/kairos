/**
 * Dependency injection container.
 * Wires together infrastructure, application layer, and exports use-case instances.
 */
import { supabase } from "../infrastructure/supabase/supabase.js";
import { SupabaseAreaRepository } from "../infrastructure/supabase/SupabaseAreaRepository.js";
import { SupabaseApiKeyRepository } from "../infrastructure/supabase/SupabaseApiKeyRepository.js";
import { SupabaseProjectRepository } from "../infrastructure/supabase/SupabaseProjectRepository.js";
import { SupabaseTaskRepository } from "../infrastructure/supabase/SupabaseTaskRepository.js";
import { SupabaseLinkRepository } from "../infrastructure/supabase/SupabaseLinkRepository.js";
import { EnrichedEventBus } from "../infrastructure/websocket/EnrichedEventBus.js";

import { CreateArea } from "../application/area/CreateArea.js";
import { UpdateArea } from "../application/area/UpdateArea.js";
import { DeleteArea } from "../application/area/DeleteArea.js";
import { ListAreas } from "../application/area/ListAreas.js";

import { CreateProject } from "../application/project/CreateProject.js";
import { UpdateProject } from "../application/project/UpdateProject.js";
import { DeleteProject } from "../application/project/DeleteProject.js";
import { ListProjects } from "../application/project/ListProjects.js";
import { DemoteProject } from "../application/project/DemoteProject.js";

import { CreateTask } from "../application/task/CreateTask.js";
import { UpdateTask } from "../application/task/UpdateTask.js";
import { DeleteTask } from "../application/task/DeleteTask.js";
import { CompleteTask } from "../application/task/CompleteTask.js";
import { ListTasks } from "../application/task/ListTasks.js";
import { PromoteTask } from "../application/task/PromoteTask.js";

import { CreateLink } from "../application/link/CreateLink.js";
import { DeleteLink } from "../application/link/DeleteLink.js";

// Repositories
export const areaRepo = new SupabaseAreaRepository(supabase);
export const apiKeyRepo = new SupabaseApiKeyRepository(supabase);
export const projectRepo = new SupabaseProjectRepository(supabase);
export const taskRepo = new SupabaseTaskRepository(supabase);
export const linkRepo = new SupabaseLinkRepository(supabase);

// Event bus (WebSocket broadcaster - populated by websocket plugin)
export const eventBus = new EnrichedEventBus();

// Use cases — Areas
export const createArea = new CreateArea(areaRepo, eventBus);
export const updateArea = new UpdateArea(areaRepo, eventBus);
export const deleteArea = new DeleteArea(areaRepo, projectRepo, taskRepo, eventBus);
export const listAreas = new ListAreas(areaRepo);

// Use cases — Projects
export const createProject = new CreateProject(projectRepo, eventBus);
export const updateProject = new UpdateProject(projectRepo, eventBus);
export const deleteProject = new DeleteProject(projectRepo, eventBus);
export const listProjects = new ListProjects(projectRepo);
export const demoteProject = new DemoteProject(taskRepo, projectRepo, eventBus);

// Use cases — Tasks
export const createTask = new CreateTask(taskRepo, eventBus);
export const updateTask = new UpdateTask(taskRepo, eventBus);
export const deleteTask = new DeleteTask(taskRepo, eventBus);
export const completeTask = new CompleteTask(taskRepo, eventBus);
export const listTasks = new ListTasks(taskRepo);
export const promoteTask = new PromoteTask(taskRepo, projectRepo, eventBus);

// Use cases — Links
export const createLink = new CreateLink(linkRepo, eventBus);
export const deleteLink = new DeleteLink(linkRepo, eventBus);
