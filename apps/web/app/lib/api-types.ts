export type Id = string;

export type ApiError = {
  message: string;
  code?: string;
  status?: number;
};

export type AuthStatusResponse = {
  authenticated: boolean;
  hasSession?: boolean;
  userId?: string | null;
  requestId?: string;
};

export type AuthMeResponse = {
  authenticated: true;
  userId: string;
  user: {
    id: string;
    name: string;
    email: string;
    image?: string | null;
    emailVerified?: boolean;
  };
  session?: { id?: string; expiresAt?: string } | null;
  requestId?: string;
};

export type Person = {
  id: Id;
  user_id: Id;
  display_name: string;
  relationship_type: string | null;
  birthday: string | null;
  anniversary: string | null;
  notes: string | null;
  image: string | null;
  created_at: string;
  updated_at: string;
};

export type Note = {
  id: Id;
  person_id: Id;
  content: string;
  source: string | null;
  occurred_at: string | null;
  meta_json: unknown;
  created_at: string;
  updated_at: string;
};

export type Event = {
  id: Id;
  person_id: Id;
  title: string;
  event_type: string | null;
  start_at: string;
  end_at: string | null;
  is_all_day: boolean;
  details: string | null;
  created_at: string;
  updated_at: string;
  person?: Person;
};

export type Gesture = {
  id: Id;
  user_id: Id;
  person_id: Id | null;
  template_id: Id | null;
  title: string;
  category: string;
  effort: string;
  status: string;
  due_at: string | null;
  completed_at: string | null;
  repeat_mode: string | null;
  repeat_every_days: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type GestureTemplate = {
  id: Id;
  user_id: Id;
  title: string;
  category: string;
  effort: string;
  description: string | null;
  created_at: string;
  updated_at: string;
};

export type PersonPreference = {
  id: Id;
  person_id: Id;
  kind: "like" | "dislike";
  value: string;
  source_note_id: Id | null;
  created_at: string;
};

export type DashboardData = {
  stats: {
    days_since_last_gesture: number;
    upcoming_task_count: number;
    this_week_count: number;
  };
  recent_gestures: Gesture[];
  upcoming_events: Event[];
  recent_notes: Array<Note & { person: Person }>;
  suggested_gestures: Gesture[];
};

export type ImportRecord = {
  id: Id;
  user_id: Id;
  person_id: Id | null;
  filename: string | null;
  source: string | null;
  status: string;
  content: string;
  parsed_data: unknown;
  notes_created: number;
  created_at: string;
  updated_at: string;
};

export type NotificationSettings = {
  user_id: Id;
  event_reminders: boolean;
  ai_suggestions: boolean;
  weekly_summary: boolean;
  email_reminders_enabled: boolean;
  email_address: string | null;
  lead_time: string;
  email_scope: string;
  include_event_details: boolean;
  updated_at?: string;
};

export type UserPreferences = {
  user_id: Id;
  theme: string;
  updated_at?: string;
};

export type ChatBlock =
  | { type: "text"; text: string }
  | {
      type: "image";
      source: {
        type: "base64";
        media_type: "image/jpeg" | "image/png" | "image/gif" | "image/webp";
        data: string;
      };
    };

export type ChatMessage = {
  role: "user" | "assistant";
  content: string | ChatBlock[];
};

export type AiMode =
  | "relationship_coach"
  | "message_drafter"
  | "conversation_analyst"
  | "plan_generator"
  | "general_assistant";

export type AiContext = {
  person?: {
    id?: string;
    displayName?: string;
    relationshipType?: string;
    notes?: string;
  };
  preferences?: {
    likes?: string[];
    dislikes?: string[];
  };
  upcomingEvents?: Array<{
    title: string;
    date?: string;
    type?: string;
  }>;
  recentGestures?: Array<{
    title: string;
    status?: string;
    dueAt?: string;
  }>;
  task?: Record<string, string | number | boolean | null | undefined>;
};

export type AiChatRequest = {
  messages: ChatMessage[];
  maxTokens?: number;
  temperature?: number;
  ai_mode?: AiMode;
  context?: AiContext;
};

export type AiChatResponse = {
  content: string;
  model: string;
  usage: {
    inputTokens: number;
    outputTokens: number;
  };
  stopReason: string | null;
  requestId?: string;
};

export type Conversation = {
  id: Id;
  user_id: Id;
  title: string;
  ai_mode: AiMode;
  created_at: string;
  updated_at: string;
};

export type ConversationMessage = {
  id: Id;
  conversation_id: Id;
  role: "user" | "assistant";
  content: string | ChatBlock[];
  sequence: number;
  created_at: string;
};

export type ConversationSendResponse = {
  userMessage: {
    id: Id;
    conversation_id: Id;
    role: "user";
    content: string | ChatBlock[];
    sequence: number;
    created_at: string;
  };
  assistantMessage: {
    id: Id;
    conversation_id: Id;
    role: "assistant";
    content: string;
    sequence: number;
    created_at: string;
  };
  response: AiChatResponse;
};

export type StreamChunk = {
  text?: string;
  done?: boolean;
  error?: string;
};
