// Shared types between server and client

export type TaskStatus = "todo" | "in_progress" | "done";
export type TaskPriority = 1 | 2 | 3 | 4;
export type TaskDurationUnit = "h" | "d" | "w" | "m";
export type LinkType = "blocks" | "blocked_by" | "related_to";
export type EntityType = "task" | "project" | "area";
export type BrainContent = unknown;
export type IntegrationProvider = "google_calendar" | "google_drive" | "todoist";
export type ShareEntityType = "project" | "task" | "brain_folder" | "brain_page";

export interface TaskDTO {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  parentTaskId: string | null;
  projectId: string | null;
  areaId: string | null;
  userId: string;
  dueDate: string | null;
  duration: number | null;
  durationUnit: TaskDurationUnit | null;
  tags: string[];
  position: number;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectDTO {
  id: string;
  name: string;
  areaId: string | null;
  completedAt: string | null;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export interface AreaDTO {
  id: string;
  name: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export interface LinkDTO {
  id: string;
  sourceId: string;
  sourceType: EntityType;
  targetId: string;
  targetType: EntityType;
  linkType: LinkType;
  userId: string;
  createdAt: string;
}

export interface BrainFolderDTO {
  id: string;
  name: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export interface BrainPageDTO {
  id: string;
  title: string;
  folderId: string | null;
  contentJson: BrainContent;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export interface ApiKeyDTO {
  id: string;
  name: string;
  keyPreview: string;
  createdAt: string;
  updatedAt: string;
}

export interface ApiKeyCreatedDTO {
  id: string;
  name: string;
  apiKey: string;
  keyPreview: string;
  createdAt: string;
  updatedAt: string;
}

export interface IntegrationStatusDTO {
  provider: IntegrationProvider;
  connected: boolean;
  connectedAt: string | null;
}

export interface NotificationDTO {
  id: string;
  type: "share_invite";
  entityType: ShareEntityType;
  entityId: string;
  entityLabel: string;
  senderEmail: string;
  recipientEmail: string;
  createdAt: string;
  expiresAt: string;
}

// WebSocket event types
export type WsEvent =
  | { type: "task:created"; payload: TaskDTO }
  | { type: "task:updated"; payload: TaskDTO }
  | { type: "task:deleted"; payload: { id: string } }
  | { type: "project:created"; payload: ProjectDTO }
  | { type: "project:updated"; payload: ProjectDTO }
  | { type: "project:deleted"; payload: { id: string } }
  | { type: "area:created"; payload: AreaDTO }
  | { type: "area:updated"; payload: AreaDTO }
  | { type: "area:deleted"; payload: { id: string } }
  | { type: "brain-folder:created"; payload: BrainFolderDTO }
  | { type: "brain-folder:updated"; payload: BrainFolderDTO }
  | { type: "brain-folder:deleted"; payload: { id: string } }
  | { type: "brain-page:created"; payload: BrainPageDTO }
  | { type: "brain-page:updated"; payload: BrainPageDTO }
  | { type: "brain-page:deleted"; payload: { id: string } }
  | { type: "notification:created"; payload: NotificationDTO }
  | { type: "link:created"; payload: LinkDTO }
  | { type: "link:deleted"; payload: { id: string } };
