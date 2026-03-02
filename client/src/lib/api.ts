import { supabase } from "./supabase.js";
import type {
  ApiKeyRotationDTO,
  ApiKeyStatusDTO,
  TaskDTO,
  ProjectDTO,
  AreaDTO,
  LinkDTO,
  TaskPriority,
  TaskDurationUnit,
  LinkType,
  EntityType,
} from "@kairos/shared";

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
    getApiKey: () => request<ApiKeyStatusDTO>("GET", "/auth/api-key"),
    rotateApiKey: () => request<ApiKeyRotationDTO>("POST", "/auth/api-key"),
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
    update: (id: string, data: { name?: string; areaId?: string | null }) =>
      request<ProjectDTO>("PUT", `/projects/${id}`, data),
    delete: (id: string) => request<void>("DELETE", `/projects/${id}`),
    demote: (id: string) => request<TaskDTO>("POST", `/projects/${id}/demote`),
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
    }) => request<TaskDTO>("POST", "/tasks", data),
    update: (id: string, data: Partial<TaskDTO>) => request<TaskDTO>("PUT", `/tasks/${id}`, data),
    delete: (id: string) => request<void>("DELETE", `/tasks/${id}`),
    complete: (id: string) => request<TaskDTO>("POST", `/tasks/${id}/complete`),
    promote: (id: string) => request<ProjectDTO>("POST", `/tasks/${id}/promote`),
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
