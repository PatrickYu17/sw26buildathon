"use client";

import { FormEvent, useMemo, useRef, useState } from "react";
import { MarkdownContent } from "./components/MarkdownContent";

type HttpMethod = "GET" | "POST";
type DebugTab = "auth" | "ai";
type DebugChatRole = "user" | "assistant" | "system";
type MessageStatus = "streaming" | "done" | "error";

type CallResult = {
  name: string;
  status: number;
  ok: boolean;
  body: unknown;
  rawText: string;
  headers: Record<string, string>;
};

type DebugChatMessage = {
  id: string;
  role: DebugChatRole;
  content: string;
  status?: MessageStatus;
};

type ApiChatMessage = {
  role: "user" | "assistant";
  content: string;
};

const DEFAULT_BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "";

const parseJsonSafely = (text: string) => {
  try {
    return text ? JSON.parse(text) : null;
  } catch {
    return null;
  }
};

const SECURITY_HEADERS = [
  "x-content-type-options",
  "x-frame-options",
  "x-xss-protection",
  "strict-transport-security",
  "x-dns-prefetch-control",
  "x-download-options",
  "x-permitted-cross-domain-policies",
  "referrer-policy",
  "cross-origin-opener-policy",
  "cross-origin-resource-policy",
  "content-security-policy",
];

const createId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

const toApiMessages = (messages: DebugChatMessage[]): ApiChatMessage[] =>
  messages
    .filter(
      (
        message,
      ): message is DebugChatMessage & { role: "user" | "assistant" } =>
        message.role === "user" || message.role === "assistant",
    )
    .filter((message) => message.content.trim().length > 0)
    .map((message) => ({
      role: message.role,
      content: message.content,
    }));

function extractSseData(eventChunk: string): string | null {
  const lines = eventChunk.split("\n");
  const dataLines: string[] = [];

  for (const rawLine of lines) {
    const line = rawLine.trimEnd();
    if (!line || line.startsWith(":")) {
      continue;
    }

    const separatorIndex = line.indexOf(":");
    const field = separatorIndex >= 0 ? line.slice(0, separatorIndex) : line;
    if (field !== "data") {
      continue;
    }

    const value =
      separatorIndex >= 0 ? line.slice(separatorIndex + 1).trimStart() : "";
    dataLines.push(value);
  }

  if (dataLines.length === 0) {
    return null;
  }

  return dataLines.join("\n");
}

function splitSseEvents(rawBuffer: string): { events: string[]; remaining: string } {
  const normalized = rawBuffer.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  const events: string[] = [];
  let remaining = normalized;

  while (true) {
    const boundaryIndex = remaining.indexOf("\n\n");
    if (boundaryIndex < 0) {
      return { events, remaining };
    }
    events.push(remaining.slice(0, boundaryIndex));
    remaining = remaining.slice(boundaryIndex + 2);
  }
}

export default function DebugPage() {
  const [activeTab, setActiveTab] = useState<DebugTab>("auth");
  const [backendUrl, setBackendUrl] = useState(DEFAULT_BACKEND_URL);

  const [name, setName] = useState("Route Test User");
  const [email, setEmail] = useState("route-test@example.com");
  const [password, setPassword] = useState("testpass1234");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CallResult | null>(null);

  const [chatMessages, setChatMessages] = useState<DebugChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatTemperature, setChatTemperature] = useState("1");
  const [chatMaxTokens, setChatMaxTokens] = useState("1024");
  const [chatBusy, setChatBusy] = useState(false);
  const [chatStatus, setChatStatus] = useState("Idle");

  const streamAbortRef = useRef<AbortController | null>(null);

  const normalizedBase = useMemo(
    () => backendUrl.trim().replace(/\/$/, ""),
    [backendUrl],
  );

  const callApi = async (
    name: string,
    path: string,
    method: HttpMethod,
    payload?: Record<string, unknown>,
  ) => {
    setLoading(true);
    try {
      const response = await fetch(`${normalizedBase}${path}`, {
        method,
        headers: payload ? { "Content-Type": "application/json" } : undefined,
        body: payload ? JSON.stringify(payload) : undefined,
        credentials: "include",
      });

      const rawText = await response.text();
      const body = parseJsonSafely(rawText);

      const headers: Record<string, string> = {};
      response.headers.forEach((value, key) => {
        headers[key] = value;
      });

      setResult({
        name,
        status: response.status,
        ok: response.ok,
        body,
        rawText,
        headers,
      });
    } catch (error) {
      setResult({
        name,
        status: 0,
        ok: false,
        body: null,
        rawText:
          error instanceof Error ? error.message : "Unknown request failure",
        headers: {},
      });
    } finally {
      setLoading(false);
    }
  };

  const onSubmitSignup = async (event: FormEvent) => {
    event.preventDefault();
    await callApi("Sign Up", "/api/auth/sign-up/email", "POST", {
      name,
      email,
      password,
    });
  };

  const onSubmitSignin = async (event: FormEvent) => {
    event.preventDefault();
    await callApi("Sign In", "/api/auth/sign-in/email", "POST", {
      email,
      password,
    });
  };

  const testRateLimit = async () => {
    setLoading(true);
    const results: { index: number; status: number }[] = [];

    for (let i = 0; i < 25; i++) {
      try {
        const response = await fetch(
          `${normalizedBase}/api/auth/get-session`,
          { method: "GET", credentials: "include" },
        );
        results.push({ index: i + 1, status: response.status });
        if (response.status === 429) break;
      } catch {
        results.push({ index: i + 1, status: 0 });
        break;
      }
    }

    const hit429 = results.some((r) => r.status === 429);
    setResult({
      name: "Rate Limit Test",
      status: hit429 ? 429 : results[results.length - 1]?.status ?? 0,
      ok: hit429,
      body: {
        totalRequests: results.length,
        hit429,
        results,
        note: hit429
          ? "Rate limiter is working - got 429 Too Many Requests"
          : "Did not hit rate limit in 25 requests (limit may be higher or already reset)",
      },
      rawText: "",
      headers: {},
    });
    setLoading(false);
  };

  const checkSecurityHeaders = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${normalizedBase}/health`, {
        method: "GET",
        credentials: "include",
      });

      const headers: Record<string, string> = {};
      response.headers.forEach((value, key) => {
        headers[key] = value;
      });

      const found: Record<string, string> = {};
      const missing: string[] = [];

      for (const h of SECURITY_HEADERS) {
        if (headers[h]) {
          found[h] = headers[h];
        } else {
          missing.push(h);
        }
      }

      setResult({
        name: "Security Headers",
        status: response.status,
        ok: Object.keys(found).length > 0,
        body: {
          present: found,
          missing,
          note:
            missing.length === SECURITY_HEADERS.length
              ? "No security headers found - helmet may not be active"
              : `Found ${Object.keys(found).length}/${SECURITY_HEADERS.length} headers`,
        },
        rawText: "",
        headers,
      });
    } catch (error) {
      setResult({
        name: "Security Headers",
        status: 0,
        ok: false,
        body: null,
        rawText:
          error instanceof Error ? error.message : "Unknown request failure",
        headers: {},
      });
    } finally {
      setLoading(false);
    }
  };

  const updateAssistantMessage = (
    assistantMessageId: string,
    updater: (existing: DebugChatMessage) => DebugChatMessage,
  ) => {
    setChatMessages((prev) =>
      prev.map((message) =>
        message.id === assistantMessageId ? updater(message) : message,
      ),
    );
  };

  const appendSystemMessage = (content: string, status: MessageStatus = "error") => {
    setChatMessages((prev) => [
      ...prev,
      {
        id: createId(),
        role: "system",
        content,
        status,
      },
    ]);
  };

  const stopStreaming = () => {
    streamAbortRef.current?.abort();
    streamAbortRef.current = null;
  };

  const submitChat = async (event: FormEvent) => {
    event.preventDefault();

    const prompt = chatInput.trim();
    if (!prompt || chatBusy) {
      return;
    }

    const userMessage: DebugChatMessage = {
      id: createId(),
      role: "user",
      content: prompt,
      status: "done",
    };
    const assistantMessageId = createId();

    const nextHistory = [
      ...chatMessages,
      userMessage,
      {
        id: assistantMessageId,
        role: "assistant" as const,
        content: "",
        status: "streaming" as const,
      },
    ];

    setChatMessages(nextHistory);
    setChatInput("");
    setChatBusy(true);
    setChatStatus("Connecting to /api/v1/ai/chat/stream...");

    const controller = new AbortController();
    streamAbortRef.current = controller;

    const parsedTemperature = Number(chatTemperature);
    const parsedMaxTokens = Number(chatMaxTokens);

    const payload: {
      messages: ApiChatMessage[];
      temperature?: number;
      maxTokens?: number;
    } = {
      messages: toApiMessages(nextHistory),
    };

    if (Number.isFinite(parsedTemperature) && parsedTemperature >= 0 && parsedTemperature <= 1) {
      payload.temperature = parsedTemperature;
    }

    if (Number.isInteger(parsedMaxTokens) && parsedMaxTokens > 0 && parsedMaxTokens <= 8192) {
      payload.maxTokens = parsedMaxTokens;
    }

    try {
      const response = await fetch(`${normalizedBase}/api/v1/ai/chat/stream`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      if (!response.ok || !response.body) {
        const rawText = await response.text();
        const parsed = parseJsonSafely(rawText) as { message?: string } | null;

        let message = parsed?.message || rawText || `Request failed with status ${response.status}`;
        if (response.status === 401 || response.status === 403) {
          message = "Authentication required. Sign in from the Auth Debug tab first.";
        } else if (response.status === 429) {
          message = "AI rate limit reached. Wait a minute and retry.";
        }

        updateAssistantMessage(assistantMessageId, (existing) => ({
          ...existing,
          content: message,
          status: "error",
        }));
        setChatStatus(`Request failed (${response.status})`);
        return;
      }

      const contentType = (response.headers.get("content-type") || "").toLowerCase();
      if (!contentType.includes("text/event-stream")) {
        const rawText = await response.text();
        updateAssistantMessage(assistantMessageId, (existing) => ({
          ...existing,
          content: rawText || `Expected SSE stream but received "${contentType || "unknown"}"`,
          status: "error",
        }));
        setChatStatus("Invalid stream response");
        return;
      }

      setChatStatus("Streaming response...");
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let streamDone = false;
      let streamErrored = false;

      const processEventChunk = (eventChunk: string) => {
        const data = extractSseData(eventChunk);
        if (!data) {
          return "continue" as const;
        }

        const payload = parseJsonSafely(data) as
          | { text?: string; done?: boolean; error?: string }
          | null;

        if (!payload) {
          return "continue" as const;
        }

        if (payload.error) {
          streamErrored = true;
          updateAssistantMessage(assistantMessageId, (existing) => ({
            ...existing,
            content: existing.content || payload.error || "Stream interrupted",
            status: "error",
          }));
          setChatStatus("Stream interrupted");
          stopStreaming();
          return "stop" as const;
        }

        if (payload.text) {
          updateAssistantMessage(assistantMessageId, (existing) => ({
            ...existing,
            content: `${existing.content}${payload.text}`,
            status: "streaming",
          }));
        }

        if (payload.done) {
          streamDone = true;
          updateAssistantMessage(assistantMessageId, (existing) => ({
            ...existing,
            status: existing.content.trim() ? "done" : "error",
            content: existing.content.trim()
              ? existing.content
              : "No response content received.",
          }));
          setChatStatus("Done");
          return "stop" as const;
        }

        return "continue" as const;
      };

      let shouldStop = false;
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const { events, remaining } = splitSseEvents(buffer);
        buffer = remaining;

        for (const eventChunk of events) {
          if (!eventChunk.trim()) {
            continue;
          }
          const action = processEventChunk(eventChunk);
          if (action === "stop") {
            shouldStop = true;
            break;
          }
        }
        if (shouldStop) break;
      }

      buffer += decoder.decode();
      const { events: finalEvents } = splitSseEvents(buffer);
      if (!shouldStop) {
        for (const eventChunk of finalEvents) {
          if (!eventChunk.trim()) {
            continue;
          }
          const action = processEventChunk(eventChunk);
          if (action === "stop") {
            shouldStop = true;
            break;
          }
        }
      }

      if (!controller.signal.aborted && !streamDone && !streamErrored) {
        updateAssistantMessage(assistantMessageId, (existing) => ({
          ...existing,
          status: existing.content.trim() ? "done" : "error",
          content: existing.content.trim()
            ? existing.content
            : "Stream ended without content.",
        }));
        setChatStatus("Done");
      }
    } catch (error) {
      const aborted = error instanceof Error && error.name === "AbortError";
      if (!aborted) {
        updateAssistantMessage(assistantMessageId, (existing) => ({
          ...existing,
          content: existing.content || (error instanceof Error ? error.message : "Unknown chat error"),
          status: "error",
        }));
        appendSystemMessage("Chat request failed. See assistant message for details.");
        setChatStatus("Error");
      } else {
        updateAssistantMessage(assistantMessageId, (existing) => ({
          ...existing,
          status: existing.content.trim() ? "done" : "error",
          content: existing.content.trim()
            ? existing.content
            : "Streaming stopped by user.",
        }));
        setChatStatus("Stopped");
      }
    } finally {
      streamAbortRef.current = null;
      setChatBusy(false);
    }
  };

  const clearChat = () => {
    stopStreaming();
    setChatMessages([]);
    setChatBusy(false);
    setChatStatus("Idle");
  };

  const securityHeadersFromResult =
    result?.name === "Security Headers"
      ? (result.body as {
          present: Record<string, string>;
          missing: string[];
          note: string;
        } | null)
      : null;

  return (
    <main className="page">
      <section className="controls-column">
        <section className="panel">
          <h1>Debug Suite</h1>
          <p>
            Standalone frontend for testing backend auth and AI routes. It does not
            share state or code with the main web app.
          </p>

          <label className="field">
            <span>Backend URL</span>
            <input
              value={backendUrl}
              onChange={(e) => setBackendUrl(e.target.value)}
              placeholder="http://localhost:3001"
            />
          </label>

          <div className="tabbar" role="tablist" aria-label="Debug tabs">
            <button
              className={`tab ${activeTab === "auth" ? "active" : ""}`}
              role="tab"
              aria-selected={activeTab === "auth"}
              onClick={() => setActiveTab("auth")}
            >
              Auth Debug
            </button>
            <button
              className={`tab ${activeTab === "ai" ? "active" : ""}`}
              role="tab"
              aria-selected={activeTab === "ai"}
              onClick={() => setActiveTab("ai")}
            >
              AI Chat
            </button>
          </div>
        </section>

        {activeTab === "auth" ? (
          <>
            <section className="panel">
              <h2>Auth Flows</h2>
              <div className="grid two">
                <form className="card" onSubmit={onSubmitSignup}>
                  <h3>Create Account</h3>
                  <label className="field">
                    <span>Name</span>
                    <input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                    />
                  </label>
                  <label className="field">
                    <span>Email</span>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </label>
                  <label className="field">
                    <span>Password</span>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      minLength={8}
                      maxLength={128}
                      required
                    />
                  </label>
                  <button disabled={loading} type="submit">
                    {loading ? "Working..." : "Sign Up"}
                  </button>
                </form>

                <form className="card" onSubmit={onSubmitSignin}>
                  <h3>Sign In</h3>
                  <label className="field">
                    <span>Email</span>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </label>
                  <label className="field">
                    <span>Password</span>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                  </label>
                  <button disabled={loading} type="submit">
                    {loading ? "Working..." : "Sign In"}
                  </button>
                </form>
              </div>
            </section>

            <section className="panel">
              <h2>Session (better-auth)</h2>
              <div className="grid three">
                <button
                  disabled={loading}
                  onClick={() => callApi("Get Session", "/api/auth/get-session", "GET")}
                >
                  Get Session
                </button>
                <button
                  disabled={loading}
                  onClick={() => callApi("Sign Out", "/api/auth/sign-out", "POST")}
                >
                  Sign Out
                </button>
              </div>
            </section>

            <section className="panel">
              <h2>
                Auth Routes <span className="badge">requires auth</span>
              </h2>
              <div className="grid three">
                <button
                  disabled={loading}
                  onClick={() => callApi("Auth Status", "/api/v1/auth/status", "GET")}
                >
                  Auth Status
                </button>
                <button
                  disabled={loading}
                  onClick={() => callApi("Auth Me", "/api/v1/auth/me", "GET")}
                >
                  Auth Me
                </button>
                <button
                  disabled={loading}
                  onClick={() => callApi("Diagnostics", "/api/v1/auth/diagnostics", "GET")}
                >
                  Diagnostics
                </button>
                <button
                  disabled={loading}
                  onClick={() =>
                    callApi(
                      "Diagnostics Sessions",
                      "/api/v1/auth/diagnostics/sessions?limit=10",
                      "GET",
                    )
                  }
                >
                  Sessions
                </button>
                <button
                  disabled={loading}
                  onClick={() =>
                    callApi("Diagnostics Accounts", "/api/v1/auth/diagnostics/accounts", "GET")
                  }
                >
                  Accounts
                </button>
              </div>
            </section>

            <section className="panel">
              <h2>Public Routes</h2>
              <div className="grid three">
                <button
                  disabled={loading}
                  onClick={() => callApi("Health", "/health", "GET")}
                >
                  Health Check
                </button>
                <button
                  disabled={loading}
                  onClick={() => callApi("Public Ping", "/api/v1/public/ping", "GET")}
                >
                  Public Ping
                </button>
              </div>
            </section>

            <section className="panel">
              <h2>
                Protected Routes <span className="badge">requires auth</span>
              </h2>
              <div className="grid three">
                <button
                  disabled={loading}
                  onClick={() => callApi("Protected Me", "/api/v1/me", "GET")}
                >
                  /me
                </button>
                <button
                  disabled={loading}
                  onClick={() => callApi("Auth Check", "/api/v1/auth-check", "GET")}
                >
                  /auth-check
                </button>
                <button
                  disabled={loading}
                  onClick={() => callApi("List People", "/api/v1/people", "GET")}
                >
                  GET /people
                </button>
                <button
                  disabled={loading}
                  onClick={() =>
                    callApi("Create Person", "/api/v1/people", "POST", {
                      name: "Debug Person",
                      relationshipType: "friend",
                    })
                  }
                >
                  POST /people
                </button>
              </div>
            </section>

            <section className="panel">
              <h2>
                Debug Routes <span className="badge warn">dev only</span>
              </h2>
              <p className="hint">
                These routes are disabled when the backend runs with NODE_ENV=production.
                A 404 confirms the guard is working.
              </p>
              <div className="grid three">
                <button
                  disabled={loading}
                  onClick={() => callApi("Debug Session", "/api/v1/debug/auth/session", "GET")}
                >
                  Debug Session
                </button>
              </div>
            </section>

            <section className="panel">
              <h2>Security Tests</h2>
              <div className="grid three">
                <button disabled={loading} onClick={checkSecurityHeaders}>
                  Check Security Headers
                </button>
                <button disabled={loading} onClick={testRateLimit}>
                  Test Rate Limit (25 reqs)
                </button>
              </div>
            </section>
          </>
        ) : (
          <section className="panel">
            <h2>
              AI Chat <span className="badge">requires auth</span>
            </h2>
            <p className="hint">
              Streams responses from <code>/api/v1/ai/chat/stream</code> using the
              backend AI service (Anthropic).
            </p>

            <form className="chat-form" onSubmit={submitChat}>
              <label className="field">
                <span>Prompt</span>
                <textarea
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  rows={4}
                  placeholder="Ask something..."
                  disabled={chatBusy}
                  required
                />
              </label>

              <div className="grid two">
                <label className="field">
                  <span>Temperature (0-1)</span>
                  <input
                    value={chatTemperature}
                    onChange={(e) => setChatTemperature(e.target.value)}
                    placeholder="1"
                    inputMode="decimal"
                  />
                </label>
                <label className="field">
                  <span>Max Tokens (1-8192)</span>
                  <input
                    value={chatMaxTokens}
                    onChange={(e) => setChatMaxTokens(e.target.value)}
                    placeholder="1024"
                    inputMode="numeric"
                  />
                </label>
              </div>

              <div className="grid three">
                <button type="submit" disabled={chatBusy || !chatInput.trim()}>
                  {chatBusy ? "Streaming..." : "Send"}
                </button>
                <button type="button" onClick={stopStreaming} disabled={!chatBusy}>
                  Stop
                </button>
                <button type="button" onClick={clearChat} disabled={chatBusy && chatMessages.length === 0}>
                  Clear
                </button>
              </div>
            </form>

            <div className="chat-status">
              <span>Status:</span> {chatStatus}
            </div>

            <section className="chat-transcript" aria-live="polite">
              {chatMessages.length === 0 ? (
                <p className="hint">No messages yet.</p>
              ) : (
                chatMessages.map((message) => (
                  <article
                    key={message.id}
                    className={`chat-bubble ${message.role} ${message.status || ""}`}
                  >
                    <header>
                      <strong>{message.role.toUpperCase()}</strong>
                      {message.status ? <span>{message.status}</span> : null}
                    </header>
                    <MarkdownContent className="chat-markdown" content={message.content || "(empty)"} />
                  </article>
                ))
              )}
            </section>
          </section>
        )}
      </section>

      <section className="output-column">
        {activeTab === "auth" ? (
          <section className="panel output">
            <h2>Last Response</h2>
            {!result ? (
              <p>No request made yet.</p>
            ) : (
              <>
                <p>
                  <strong>{result.name}</strong> | status: {result.status} | ok:{" "}
                  {String(result.ok)}
                </p>
                {securityHeadersFromResult && (
                  <div className="header-grid">
                    {Object.entries(securityHeadersFromResult.present).map(
                      ([key, value]) => (
                        <div key={key} className="header-row ok">
                          <span className="header-name">{key}</span>
                          <span className="header-value">{value}</span>
                        </div>
                      ),
                    )}
                    {securityHeadersFromResult.missing.map((key) => (
                      <div key={key} className="header-row missing">
                        <span className="header-name">{key}</span>
                        <span className="header-value">not set</span>
                      </div>
                    ))}
                  </div>
                )}
                <pre>
                  {result.body
                    ? JSON.stringify(result.body, null, 2)
                    : result.rawText || "(empty body)"}
                </pre>
              </>
            )}
          </section>
        ) : (
          <section className="panel output">
            <h2>AI Route Debug</h2>
            <pre>
{`Endpoint: ${normalizedBase}/api/v1/ai/chat/stream
Auth: better-auth session cookie required
Transport: text/event-stream (SSE)
Provider path: route -> aiService -> anthropic client`}
            </pre>
          </section>
        )}
      </section>
    </main>
  );
}
