import type {
  ApiKeyCreatedDTO,
  ApiKeyDTO,
  AreaDTO,
  BrainContent,
  BrainFolderDTO,
  BrainPageDTO,
  EntityType,
  IntegrationStatusDTO,
  LinkDTO,
  LinkType,
  NotificationDTO,
  ProjectDTO,
  ShareEntityType,
  TaskDTO,
  TaskDurationUnit,
  TaskPriority,
} from "@kairos/shared";
import { supabase } from "./supabase.js";

const apiOrigin = (import.meta.env["VITE_API_URL"] as string | undefined)?.replace(/\/$/, "") ?? "";
const BASE = `${apiOrigin}/api/v1`;

async function getAuthHeader(): Promise<Record<string, string>> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) throw new Error("Not authenticated");
  return { Authorization: `Bearer ${token}` };
}

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  const headers = await getAuthHeader();
  const init: RequestInit = {
    method,
    headers,
  };
  if (body !== undefined) {
    (init.headers as Record<string, string>)["Content-Type"] = "application/json";
    init.body = JSON.stringify(body);
  }

  const res = await fetch(`${BASE}${path}`, init);

  if (!res.ok) {
    const raw = await res.text();
    if (!raw) throw new Error(res.statusText);

    let message = res.statusText;
    try {
      const parsed = JSON.parse(raw) as { error?: string; message?: string };
      message = parsed.error ?? parsed.message ?? res.statusText;
    } catch {
      message = raw || res.statusText;
    }
    throw new Error(message);
  }

  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

// ── Areas ─────────────────────────────────────────────────────────────────
export const api = {
  auth: {
    listApiKeys: () => request<ApiKeyDTO[]>("GET", "/auth/api-keys"),
    createApiKey: (name: string) => request<ApiKeyCreatedDTO>("POST", "/auth/api-keys", { name }),
    deleteApiKey: (id: string) => request<void>("DELETE", `/auth/api-keys/${id}`),
  },

  integrations: {
    list: () => request<IntegrationStatusDTO[]>("GET", "/integrations"),
    getGoogleAuthUrl: () => request<{ url: string }>("POST", "/integrations/google/start"),
    saveTodoistToken: (token: string) =>
      request<void>("PUT", "/integrations/todoist/token", { token }),
    disconnect: (provider: "google" | "todoist") =>
      request<void>("DELETE", `/integrations/${provider}`),
  },

  collaboration: {
    createInvite: (data: {
      recipientEmail: string;
      entityType: ShareEntityType;
      entityId: string;
    }) => request<{ ok: true }>("POST", "/collaboration/invites", data),
  },

  notifications: {
    list: () => request<NotificationDTO[]>("GET", "/notifications"),
    accept: (id: string) => request<{ ok: true }>("POST", `/notifications/${id}/accept`),
    decline: (id: string) => request<{ ok: true }>("POST", `/notifications/${id}/decline`),
  },

  areas: {
    list: () => request<AreaDTO[]>("GET", "/areas"),
    create: (name: string) => request<AreaDTO>("POST", "/areas", { name }),
    update: (id: string, name: string) => request<AreaDTO>("PUT", `/areas/${id}`, { name }),
    delete: (id: string) => request<void>("DELETE", `/areas/${id}`),
  },

  projects: {
    list: () => request<ProjectDTO[]>("GET", "/projects"),
    create: (name: string, areaId?: string) =>
      request<ProjectDTO>("POST", "/projects", { name, areaId }),
    update: (
      id: string,
      data: { name?: string; areaId?: string | null; completedAt?: string | null },
    ) => request<ProjectDTO>("PUT", `/projects/${id}`, data),
    delete: (id: string) => request<void>("DELETE", `/projects/${id}`),
    demote: (id: string) => request<TaskDTO>("POST", `/projects/${id}/demote`),
  },

  brain: {
    list: () => request<{ folders: BrainFolderDTO[]; pages: BrainPageDTO[] }>("GET", "/brain"),
    createFolder: (name: string) => request<BrainFolderDTO>("POST", "/brain/folders", { name }),
    createPage: (data: { title: string; folderId?: string | null; contentJson?: BrainContent }) =>
      request<BrainPageDTO>("POST", "/brain/pages", data),
    updatePage: (
      id: string,
      data: { title?: string; folderId?: string | null; contentJson?: BrainContent },
    ) => request<BrainPageDTO>("PUT", `/brain/pages/${id}`, data),
    deletePage: (id: string) => request<void>("DELETE", `/brain/pages/${id}`),
  },

  tasks: {
    list: (params?: {
      projectId?: string;
      areaId?: string;
      inbox?: boolean;
      parentTaskId?: string;
    }) => {
      const qs = new URLSearchParams();
      if (params?.projectId) qs.set("projectId", params.projectId);
      if (params?.areaId) qs.set("areaId", params.areaId);
      if (params?.inbox) qs.set("inbox", "true");
      if (params?.parentTaskId) qs.set("parentTaskId", params.parentTaskId);
      const query = qs.toString() ? `?${qs.toString()}` : "";
      return request<TaskDTO[]>("GET", `/tasks${query}`);
    },
    create: (data: {
      title: string;
      description?: string;
      priority?: TaskPriority;
      projectId?: string;
      areaId?: string;
      parentTaskId?: string;
      dueDate?: string;
      duration?: number;
      durationUnit?: TaskDurationUnit;
      tags?: string[];
    }) => request<TaskDTO>("POST", "/tasks", data),
    update: (id: string, data: Partial<TaskDTO>) => request<TaskDTO>("PUT", `/tasks/${id}`, data),
    delete: (id: string) => request<void>("DELETE", `/tasks/${id}`),
    complete: (id: string) => request<TaskDTO>("POST", `/tasks/${id}/complete`),
    reopen: (id: string) => request<TaskDTO>("POST", `/tasks/${id}/reopen`),
    promote: (id: string) => request<ProjectDTO>("POST", `/tasks/${id}/promote`),
    move: (id: string, afterId: string | null) =>
      request<TaskDTO>("PUT", `/tasks/${id}/move`, { afterId }),
  },

  links: {
    create: (data: {
      sourceId: string;
      sourceType: EntityType;
      targetId: string;
      targetType: EntityType;
      linkType: LinkType;
    }) => request<LinkDTO[]>("POST", "/links", data),
    delete: (id: string) => request<void>("DELETE", `/links/${id}`),
  },
};
