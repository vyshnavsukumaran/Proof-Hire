"use client";

import type {
  Analytics,
  Application,
  Conversation,
  Job,
  Message,
  Project,
  Recommendation,
  ShortlistEntry,
  TokenResponse,
  UserWithProfile,
} from "./types";

const BASE = "/api";

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      "content-type": "application/json",
      ...(options.headers ?? {}),
    },
  });
  const isJson = (res.headers.get("content-type") ?? "").includes("json");
  const data = isJson ? await res.json() : null;
  if (!res.ok) {
    throw new ApiError(res.status, data?.detail ?? data?.message ?? `Request failed (${res.status})`);
  }
  return data as T;
}

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

async function upload<T>(path: string, file: File, query = ""): Promise<T> {
  const form = new FormData();
  form.append("file", file);
  const res = await fetch(`${BASE}${path}${query}`, {
    method: "POST",
    body: form,
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    throw new ApiError(res.status, data?.detail ?? `Upload failed (${res.status})`);
  }
  return data as T;
}

export const api = {
  // auth
  login: (email: string, password: string) =>
    request<TokenResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),
  register: (payload: { email: string; password: string; name: string; role: string }) =>
    request<TokenResponse>("/auth/register", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  logout: () => request<{ ok: boolean }>("/auth/logout", { method: "POST" }),
  refresh: () => request<TokenResponse>("/auth/refresh", { method: "POST" }),

  // me
  me: () => request<UserWithProfile>("/auth/me"),
  updateMe: (payload: Record<string, unknown>) =>
    request<UserWithProfile>("/auth/me", { method: "PATCH", body: JSON.stringify(payload) }),

  // users / portfolios
  user: (id: number) => request<UserWithProfile>(`/users/${id}`),
  portfolio: (id: number) => request<UserWithProfile>(`/users/${id}/portfolio`),

  // projects
  project: (id: number) => request<Project>(`/projects/${id}`),
  createProject: (payload: object) =>
    request<Project>("/projects", { method: "POST", body: JSON.stringify(payload) }),
  updateProject: (id: number, payload: object) =>
    request<Project>(`/projects/${id}`, { method: "PATCH", body: JSON.stringify(payload) }),
  deleteProject: (id: number) => request<void>(`/projects/${id}`, { method: "DELETE" }),
  recordView: (id: number) => request<Project>(`/projects/${id}/view`, { method: "POST" }),

  // jobs
  jobs: (params?: Record<string, string | boolean | undefined>) => {
    const qs = new URLSearchParams();
    Object.entries(params ?? {}).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== "") qs.set(k, String(v));
    });
    const query = qs.toString();
    return request<Job[]>(`/jobs${query ? `?${query}` : ""}`);
  },
  job: (id: number) => request<Job>(`/jobs/${id}`),
  createJob: (payload: Record<string, unknown>) =>
    request<Job>("/jobs", { method: "POST", body: JSON.stringify(payload) }),
  updateJob: (id: number, payload: Record<string, unknown>) =>
    request<Job>(`/jobs/${id}`, { method: "PATCH", body: JSON.stringify(payload) }),

  // search
  searchTalent: (params?: Record<string, string | number | boolean | undefined>) => {
    const qs = new URLSearchParams();
    Object.entries(params ?? {}).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== "") qs.set(k, String(v));
    });
    return request<UserWithProfile[]>(`/search/talent?${qs.toString()}`);
  },
  searchJobs: (params?: Record<string, string | number | boolean | undefined>) => {
    const qs = new URLSearchParams();
    Object.entries(params ?? {}).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== "") qs.set(k, String(v));
    });
    return request<Job[]>(`/search/jobs?${qs.toString()}`);
  },

  // skills
  skills: (q?: string) =>
    request<{ id: number; name: string; category?: string | null }[]>(
      `/skills${q ? `?q=${encodeURIComponent(q)}` : ""}`
    ),

  // applications
  apply: (payload: {
    job_id: number;
    cover_letter?: string;
    evidence_project_ids: number[];
  }) => request<Application>("/applications", { method: "POST", body: JSON.stringify(payload) }),
  myApplications: () => request<Application[]>("/applications/mine"),
  receivedApplications: () => request<Application[]>("/applications/received"),
  updateApplicationStatus: (id: number, status: string) =>
    request<Application>(`/applications/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    }),

  // messaging
  conversations: () => request<Conversation[]>("/messaging/conversations"),
  startConversation: (payload: {
    candidate_id: number;
    employer_id: number;
    job_id?: number | null;
  }) => request<Conversation>("/messaging/conversations", { method: "POST", body: JSON.stringify(payload) }),
  messages: (conversationId: number) =>
    request<Message[]>(`/messaging/conversations/${conversationId}/messages`),
  sendMessage: (conversationId: number, body: string) =>
    request<Message>(`/messaging/conversations/${conversationId}/messages`, {
      method: "POST",
      body: JSON.stringify({ body }),
    }),

  // shortlist
  shortlist: () => request<ShortlistEntry[]>("/shortlist"),
  addShortlist: (payload: { candidate_id: number; notes?: string }) =>
    request<ShortlistEntry>("/shortlist", { method: "POST", body: JSON.stringify(payload) }),
  updateShortlist: (id: number, payload: Record<string, unknown>) =>
    request<ShortlistEntry>(`/shortlist/${id}`, { method: "PATCH", body: JSON.stringify(payload) }),
  removeShortlist: (id: number) => request<void>(`/shortlist/${id}`, { method: "DELETE" }),

  // recommendations
  recommendedJobs: () => request<Recommendation[]>("/recommendations/jobs"),
  recommendedCandidates: (jobId?: number) =>
    request<Recommendation[]>(
      `/recommendations/candidates${jobId ? `?job_id=${jobId}` : ""}`
    ),

  // analytics
  analytics: () => request<Analytics>("/users/me/analytics"),

  // uploads
  uploadAvatar: (file: File) => upload<{ url: string }>("/uploads/avatar", file),
  uploadProjectMedia: (projectId: number, file: File) =>
    upload<{ url: string; media_url: string }>(
      `/uploads/project-media`,
      file,
      `?project_id=${projectId}`
    ),
};
