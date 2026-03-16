/**
 * Dependency injection container.
 * Wires together infrastructure, application layer, and exports use-case instances.
 */
import { supabase } from "../infrastructure/supabase/supabase.js";
import { SupabaseApiKeyRepository } from "../infrastructure/supabase/SupabaseApiKeyRepository.js";
import { SupabaseAreaRepository } from "../infrastructure/supabase/SupabaseAreaRepository.js";
import { SupabaseBrainFolderRepository } from "../infrastructure/supabase/SupabaseBrainFolderRepository.js";
import { SupabaseBrainPageRepository } from "../infrastructure/supabase/SupabaseBrainPageRepository.js";
import { SupabaseCollaborationInviteRepository } from "../infrastructure/supabase/SupabaseCollaborationInviteRepository.js";
import { SupabaseCollaborationShareRepository } from "../infrastructure/supabase/SupabaseCollaborationShareRepository.js";
import { SupabaseLinkRepository } from "../infrastructure/supabase/SupabaseLinkRepository.js";
import { SupabaseProjectRepository } from "../infrastructure/supabase/SupabaseProjectRepository.js";
import { SupabaseTaskRepository } from "../infrastructure/supabase/SupabaseTaskRepository.js";
import { SupabaseIntegrationConnectionRepository } from "../infrastructure/supabase/SupabaseIntegrationConnectionRepository.js";
import { SupabaseUserDirectory } from "../infrastructure/supabase/SupabaseUserDirectory.js";
import { TokenCipher } from "../infrastructure/security/tokenCipher.js";
import { EnrichedEventBus } from "../infrastructure/websocket/EnrichedEventBus.js";

import { CreateArea } from "../application/area/CreateArea.js";
import { DeleteArea } from "../application/area/DeleteArea.js";
import { ListAreas } from "../application/area/ListAreas.js";
import { UpdateArea } from "../application/area/UpdateArea.js";

import { CreateProject } from "../application/project/CreateProject.js";
import { DeleteProject } from "../application/project/DeleteProject.js";
import { DemoteProject } from "../application/project/DemoteProject.js";
import { ListProjects } from "../application/project/ListProjects.js";
import { UpdateProject } from "../application/project/UpdateProject.js";

import { CompleteTask } from "../application/task/CompleteTask.js";
import { CreateTask } from "../application/task/CreateTask.js";
import { DeleteTask } from "../application/task/DeleteTask.js";
import { ListTasks } from "../application/task/ListTasks.js";
import { PromoteTask } from "../application/task/PromoteTask.js";
import { ReorderTask } from "../application/task/ReorderTask.js";
import { UpdateTask } from "../application/task/UpdateTask.js";

import { CreateLink } from "../application/link/CreateLink.js";
import { DeleteLink } from "../application/link/DeleteLink.js";
import { ReopenTask } from "../application/task/ReopenTask.js";
import { CreateBrainFolder } from "../application/brain/CreateBrainFolder.js";
import { CreateBrainPage } from "../application/brain/CreateBrainPage.js";
import { DeleteBrainPage } from "../application/brain/DeleteBrainPage.js";
import { ListBrainFolders } from "../application/brain/ListBrainFolders.js";
import { ListBrainPages } from "../application/brain/ListBrainPages.js";
import { UpdateBrainPage } from "../application/brain/UpdateBrainPage.js";
import { ConnectGoogleIntegration } from "../application/integration/ConnectGoogleIntegration.js";
import { DisconnectIntegration } from "../application/integration/DisconnectIntegration.js";
import { GetGoogleAuthUrl } from "../application/integration/GetGoogleAuthUrl.js";
import { GoogleOAuthService } from "../application/integration/GoogleOAuthService.js";
import { ListIntegrationStatuses } from "../application/integration/ListIntegrationStatuses.js";
import { SaveTodoistToken } from "../application/integration/SaveTodoistToken.js";
import { CreateCollaborationInvite } from "../application/collaboration/CreateCollaborationInvite.js";
import { ListNotifications } from "../application/collaboration/ListNotifications.js";
import { RespondToInvite } from "../application/collaboration/RespondToInvite.js";

// Repositories
export const areaRepo = new SupabaseAreaRepository(supabase);
export const apiKeyRepo = new SupabaseApiKeyRepository(supabase);
export const collaborationShareRepo = new SupabaseCollaborationShareRepository(supabase);
export const collaborationInviteRepo = new SupabaseCollaborationInviteRepository(supabase);
export const userDirectory = new SupabaseUserDirectory(supabase);
export const projectRepo = new SupabaseProjectRepository(supabase, collaborationShareRepo);
export const taskRepo = new SupabaseTaskRepository(supabase, collaborationShareRepo);
export const linkRepo = new SupabaseLinkRepository(supabase);
export const brainFolderRepo = new SupabaseBrainFolderRepository(supabase, collaborationShareRepo);
export const brainPageRepo = new SupabaseBrainPageRepository(supabase, collaborationShareRepo);
const integrationEncryptionKey = process.env["INTEGRATIONS_ENCRYPTION_KEY"];
if (!integrationEncryptionKey) {
  throw new Error("Missing INTEGRATIONS_ENCRYPTION_KEY environment variable");
}
const serverUrl = process.env["SERVER_URL"] ?? `http://localhost:${process.env["PORT"] ?? "3000"}`;
const clientUrl = process.env["CLIENT_URL"] ?? "http://localhost:5173";
const googleClientId = process.env["GOOGLE_CLIENT_ID"];
const googleClientSecret = process.env["GOOGLE_CLIENT_SECRET"];
if (!googleClientId || !googleClientSecret) {
  throw new Error("Missing GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET environment variables");
}
export const tokenCipher = new TokenCipher(integrationEncryptionKey);
export const integrationRepo = new SupabaseIntegrationConnectionRepository(supabase, tokenCipher);
export const googleOAuth = new GoogleOAuthService(tokenCipher, {
  clientId: googleClientId,
  clientSecret: googleClientSecret,
  clientUrl,
  serverUrl,
});

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
export const createTask = new CreateTask(taskRepo, eventBus, undefined, projectRepo);
export const updateTask = new UpdateTask(taskRepo, eventBus);
export const deleteTask = new DeleteTask(taskRepo, eventBus);
export const completeTask = new CompleteTask(taskRepo, eventBus);
export const reopenTask = new ReopenTask(taskRepo, eventBus);
export const listTasks = new ListTasks(taskRepo);
export const promoteTask = new PromoteTask(taskRepo, projectRepo, eventBus);
export const reorderTask = new ReorderTask(taskRepo, eventBus);

// Use cases — Brain
export const listBrainFolders = new ListBrainFolders(brainFolderRepo);
export const listBrainPages = new ListBrainPages(brainPageRepo);
export const createBrainFolder = new CreateBrainFolder(brainFolderRepo, eventBus);
export const createBrainPage = new CreateBrainPage(brainPageRepo, brainFolderRepo, eventBus);
export const updateBrainPage = new UpdateBrainPage(brainPageRepo, brainFolderRepo, eventBus);
export const deleteBrainPage = new DeleteBrainPage(brainPageRepo);

// Use cases — Links
export const createLink = new CreateLink(linkRepo, eventBus);
export const deleteLink = new DeleteLink(linkRepo, eventBus);

// Use cases — Collaboration
export const createCollaborationInvite = new CreateCollaborationInvite(
  userDirectory,
  collaborationInviteRepo,
  collaborationShareRepo,
  projectRepo,
  taskRepo,
  brainFolderRepo,
  brainPageRepo,
);
export const listNotifications = new ListNotifications(collaborationInviteRepo);
export const respondToInvite = new RespondToInvite(collaborationInviteRepo, collaborationShareRepo);

// Use cases — Integrations
export const listIntegrationStatuses = new ListIntegrationStatuses(integrationRepo);
export const getGoogleAuthUrl = new GetGoogleAuthUrl(googleOAuth);
export const connectGoogleIntegration = new ConnectGoogleIntegration(integrationRepo, googleOAuth);
export const saveTodoistToken = new SaveTodoistToken(integrationRepo);
export const disconnectIntegration = new DisconnectIntegration(integrationRepo);
