import type {
  AiContext,
  AiMode,
  AiChatRequest,
  AiChatResponse,
  AuthMeResponse,
  AuthStatusResponse,
  ChatBlock,
  Conversation,
  ConversationMessage,
  ConversationSendResponse,
  DashboardData,
  Event,
  Gesture,
  GestureTemplate,
  ImportRecord,
  Note,
  NotificationSettings,
  Person,
  PersonPreference,
  StreamChunk,
  UserPreferences,
} from "@/app/lib/api-types";
import { streamJsonSse } from "@/app/lib/sse";
import { buildLoginRedirectPath } from "@/app/lib/auth-redirect";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api/v1";
const AUTH_BASE = process.env.NEXT_PUBLIC_AUTH_URL || "http://localhost:3001/api/auth";

type ApiErrorPayload = {
  message?: string;
  error?: string;
  requestId?: string;
};

export class ApiRequestError extends Error {
  status: number;
  code?: string;
  requestId?: string;

  constructor(message: string, options: { status: number; code?: string; requestId?: string }) {
    super(message);
    this.name = "ApiRequestError";
    this.status = options.status;
    this.code = options.code;
    this.requestId = options.requestId;
  }
}

export function isApiRequestError(error: unknown): error is ApiRequestError {
  return error instanceof ApiRequestError;
}

function maybeRedirectUnauthorized(status: number) {
  if (status !== 401 || typeof window === "undefined") return;
  const nextPath = `${window.location.pathname}${window.location.search}`;
  const target = buildLoginRedirectPath(nextPath);
  if (window.location.pathname !== "/login") {
    window.location.assign(target);
  }
}

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  const opts: RequestInit = {
    method,
    credentials: "include",
    headers: { "Content-Type": "application/json" },
  };

  if (body !== undefined) {
    opts.body = JSON.stringify(body);
  }

  const res = await fetch(`${API_BASE}${path}`, opts);

  if (res.status === 204) {
    return undefined as T;
  }

  let json: unknown = null;
  try {
    json = await res.json();
  } catch {
    if (!res.ok) {
      throw new Error(`Request failed: ${res.status}`);
    }
  }

  if (!res.ok) {
    const parsed = json as ApiErrorPayload | null;
    maybeRedirectUnauthorized(res.status);
    throw new ApiRequestError(
      parsed?.message || parsed?.error || `Request failed: ${res.status}`,
      {
        status: res.status,
        code: parsed?.error,
        requestId: parsed?.requestId,
      },
    );
  }

  return json as T;
}

function qs(params: Record<string, string | number | boolean | undefined | null>): string {
  const entries = Object.entries(params).filter(([, v]) => v != null && v !== "");
  if (entries.length === 0) return "";
  return `?${entries.map(([k, v]) => `${k}=${encodeURIComponent(String(v))}`).join("&")}`;
}

export const api = {
  auth: {
    status: () => request<AuthStatusResponse>("GET", "/auth/status"),
    me: () => request<AuthMeResponse>("GET", "/auth/me"),
    signOut: async () => {
      const res = await fetch(`${AUTH_BASE}/sign-out`, { method: "POST", credentials: "include" });
      if (!res.ok) throw new Error("Sign out failed");
    },
  },

  ai: {
    chat: (body: AiChatRequest) => request<AiChatResponse>("POST", "/ai/chat", body),
    chatStream: async function* (body: AiChatRequest): AsyncGenerator<StreamChunk, void, unknown> {
      const response = await fetch(`${API_BASE}/ai/chat/stream`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        let payload: ApiErrorPayload | null = null;
        try {
          payload = (await response.json()) as ApiErrorPayload;
        } catch {}
        maybeRedirectUnauthorized(response.status);
        throw new ApiRequestError(
          payload?.message || payload?.error || `Request failed: ${response.status}`,
          {
            status: response.status,
            code: payload?.error,
            requestId: payload?.requestId,
          },
        );
      }

      yield* streamJsonSse(response);
    },
  },

  conversations: {
    create: (body?: { title?: string; ai_mode?: AiMode }) =>
      request<Conversation>("POST", "/ai/conversations", body ?? {}),
    list: () => request<{ conversations: Conversation[] }>("GET", "/ai/conversations"),
    messages: (id: string) => request<{ messages: ConversationMessage[] }>("GET", `/ai/conversations/${id}/messages`),
    sendMessage: (
      id: string,
      body: { content: string | ChatBlock[]; maxTokens?: number; temperature?: number; context?: AiContext },
    ) => request<ConversationSendResponse>("POST", `/ai/conversations/${id}/messages`, body),
    sendMessageStream: async function* (
      id: string,
      body: { content: string | ChatBlock[]; maxTokens?: number; temperature?: number; context?: AiContext },
    ): AsyncGenerator<StreamChunk, void, unknown> {
      const response = await fetch(`${API_BASE}/ai/conversations/${id}/messages/stream`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        let payload: ApiErrorPayload | null = null;
        try {
          payload = (await response.json()) as ApiErrorPayload;
        } catch {}
        maybeRedirectUnauthorized(response.status);
        throw new ApiRequestError(
          payload?.message || payload?.error || `Request failed: ${response.status}`,
          {
            status: response.status,
            code: payload?.error,
            requestId: payload?.requestId,
          },
        );
      }

      yield* streamJsonSse(response);
    },
  },

  people: {
    list: (opts?: { search?: string; relationship_type?: string }) =>
      request<{ data: Person[] }>("GET", `/people${qs(opts ?? {})}`),
    get: (id: string) => request<{ data: Person }>("GET", `/people/${id}`),
    create: (body: { display_name: string; relationship_type?: string; birthday?: string; anniversary?: string }) =>
      request<{ data: Person }>("POST", "/people", body),
    update: (
      id: string,
      body: Partial<{ display_name: string; relationship_type: string; birthday: string | null; anniversary: string | null; notes: string; image: string | null }>,
    ) => request<{ data: Person }>("PATCH", `/people/${id}`, body),
    delete: (id: string) => request<void>("DELETE", `/people/${id}`),
  },

  notes: {
    list: (personId: string, opts?: { search?: string; limit?: number; offset?: number }) =>
      request<{ data: Note[]; total: number }>("GET", `/people/${personId}/notes${qs(opts ?? {})}`),
    create: (
      personId: string,
      body: { content: string; source?: string; occurred_at?: string; meta_json?: unknown },
    ) => request<{ data: Note }>("POST", `/people/${personId}/notes`, body),
    update: (
      id: string,
      body: Partial<{ content: string; source: string; occurred_at: string | null; meta_json: unknown }>,
    ) => request<{ data: Note }>("PATCH", `/notes/${id}`, body),
    delete: (id: string) => request<void>("DELETE", `/notes/${id}`),
    quick: (body: { person_id: string; content: string }) => request<{ data: Note }>("POST", "/notes/quick", body),
    search: (q: string, limit?: number) => request<{ data: Note[] }>("GET", `/notes/search${qs({ q, limit })}`),
  },

  events: {
    forPerson: (personId: string, opts?: { from?: string; to?: string }) =>
      request<{ data: Event[] }>("GET", `/people/${personId}/events${qs(opts ?? {})}`),
    create: (
      personId: string,
      body: { title: string; event_type?: string; start_at: string; end_at?: string; is_all_day?: boolean; details?: string },
    ) => request<{ data: Event }>("POST", `/people/${personId}/events`, body),
    update: (
      id: string,
      body: Partial<{ title: string; event_type: string; start_at: string; end_at: string | null; is_all_day: boolean; details: string }>,
    ) => request<{ data: Event }>("PATCH", `/events/${id}`, body),
    delete: (id: string) => request<void>("DELETE", `/events/${id}`),
    forDay: (date: string) => request<{ data: Event[] }>("GET", `/events/day${qs({ date })}`),
    forRange: (from: string, to: string) => request<{ data: Event[] }>("GET", `/events/range${qs({ from, to })}`),
    upcoming: (limit?: number) => request<{ data: Event[] }>("GET", `/events/upcoming${qs({ limit })}`),
  },

  gestures: {
    list: (opts?: { status?: string; person_id?: string; category?: string; effort?: string }) =>
      request<{ data: Gesture[] }>("GET", `/gestures${qs(opts ?? {})}`),
    get: (id: string) => request<{ data: Gesture }>("GET", `/gestures/${id}`),
    create: (body: Record<string, unknown>) => request<{ data: Gesture }>("POST", "/gestures", body),
    fromTemplate: (body: { template_id: string; person_id?: string; due_at?: string; overrides?: Record<string, unknown> }) =>
      request<{ data: Gesture }>("POST", "/gestures/from-template", body),
    update: (id: string, body: Record<string, unknown>) => request<{ data: Gesture }>("PATCH", `/gestures/${id}`, body),
    complete: (id: string) => request<{ data: Gesture }>("POST", `/gestures/${id}/complete`),
    skip: (id: string) => request<{ data: Gesture }>("POST", `/gestures/${id}/skip`),
    delete: (id: string) => request<void>("DELETE", `/gestures/${id}`),
    upcoming: (limit?: number) => request<{ data: Gesture[] }>("GET", `/gestures/upcoming${qs({ limit })}`),
    overdue: () => request<{ data: Gesture[] }>("GET", "/gestures/overdue"),
  },

  templates: {
    list: () => request<{ data: GestureTemplate[] }>("GET", "/gesture-templates"),
    create: (body: { title: string; category: string; effort: string; description?: string }) =>
      request<{ data: GestureTemplate }>("POST", "/gesture-templates", body),
    update: (id: string, body: Partial<{ title: string; category: string; effort: string; description: string }>) =>
      request<{ data: GestureTemplate }>("PATCH", `/gesture-templates/${id}`, body),
    delete: (id: string) => request<void>("DELETE", `/gesture-templates/${id}`),
  },

  preferences: {
    list: (personId: string, opts?: { kind?: string }) =>
      request<{ data: PersonPreference[] }>("GET", `/people/${personId}/preferences${qs(opts ?? {})}`),
    create: (personId: string, body: { kind: "like" | "dislike"; value: string; source_note_id?: string }) =>
      request<{ data: PersonPreference }>("POST", `/people/${personId}/preferences`, body),
    delete: (id: string) => request<void>("DELETE", `/preferences/${id}`),
    summary: (personId: string) => request<{ data: { likes: string[]; dislikes: string[] } }>("GET", `/people/${personId}/preferences/summary`),
  },

  dashboard: {
    get: (personId?: string) => request<{ data: DashboardData }>("GET", `/dashboard${qs({ person_id: personId })}`),
  },

  imports: {
    upload: (body: { content: string; source?: string; filename?: string; person_id?: string }) =>
      request<{ data: ImportRecord }>("POST", "/imports/instagram", body),
    list: (opts?: { status?: string; limit?: number }) =>
      request<{ data: ImportRecord[] }>("GET", `/imports${qs(opts ?? {})}`),
    get: (id: string) => request<{ data: ImportRecord }>("GET", `/imports/${id}`),
    createNotes: (id: string, body: { person_id: string }) =>
      request<{ data: { notes_created: number } }>("POST", `/imports/${id}/create-notes`, body),
  },

  settings: {
    getNotifications: () => request<{ data: NotificationSettings }>("GET", "/settings/notifications"),
    updateNotifications: (body: Partial<NotificationSettings>) =>
      request<{ data: NotificationSettings }>("PUT", "/settings/notifications", body),
    getPreferences: () => request<{ data: UserPreferences }>("GET", "/settings/preferences"),
    updatePreferences: (body: Partial<UserPreferences>) =>
      request<{ data: UserPreferences }>("PUT", "/settings/preferences", body),
    updateProfile: (body: { name?: string; email?: string; image?: string | null }) =>
      request<{ data: { id: string; name: string; email: string; image: string | null } }>("PATCH", "/settings/profile", body),
    changePassword: (body: { current_password: string; new_password: string }) =>
      request<{ success: boolean }>("POST", "/settings/password", body),
    deleteAccount: (body: { password: string }) => request<void>("DELETE", "/settings/account", body),
  },
};
