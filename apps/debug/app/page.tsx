"use client";

import { FormEvent, useMemo, useState } from "react";

type HttpMethod = "GET" | "POST";

type CallResult = {
  name: string;
  status: number;
  ok: boolean;
  body: unknown;
  rawText: string;
  headers: Record<string, string>;
};

const DEFAULT_BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001";

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

export default function DebugAuthPage() {
  const [backendUrl, setBackendUrl] = useState(DEFAULT_BACKEND_URL);
  const [name, setName] = useState("Route Test User");
  const [email, setEmail] = useState("route-test@example.com");
  const [password, setPassword] = useState("testpass1234");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CallResult | null>(null);

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
          ? "Rate limiter is working — got 429 Too Many Requests"
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
              ? "No security headers found — helmet may not be active"
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

  const securityHeadersFromResult =
    result?.name === "Security Headers" ? result.body as {
      present: Record<string, string>;
      missing: string[];
      note: string;
    } | null : null;

  return (
    <main className="page">
      <section className="controls-column">
        <section className="panel">
          <h1>Auth Debug UI</h1>
          <p>
            Standalone frontend for testing backend auth routes. It does not share
            state or code with the main web app.
          </p>

          <label className="field">
            <span>Backend URL</span>
            <input
              value={backendUrl}
              onChange={(e) => setBackendUrl(e.target.value)}
              placeholder="http://localhost:3001"
            />
          </label>

          {/* Auth forms */}
          <div className="grid two">
            <form className="card" onSubmit={onSubmitSignup}>
              <h2>Create Account</h2>
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
              <h2>Sign In</h2>
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

        {/* better-auth session endpoints */}
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

        {/* Auth diagnostic routes (/api/v1/auth) */}
        <section className="panel">
          <h2>Auth Routes <span className="badge">requires auth</span></h2>
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

        {/* Public & health routes */}
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

        {/* Protected routes (/api/v1) */}
        <section className="panel">
          <h2>Protected Routes <span className="badge">requires auth</span></h2>
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

        {/* Debug routes (disabled in production) */}
        <section className="panel">
          <h2>Debug Routes <span className="badge warn">dev only</span></h2>
          <p className="hint">
            These routes are disabled when the backend runs with NODE_ENV=production.
            A 404 confirms the guard is working.
          </p>
          <div className="grid three">
            <button
              disabled={loading}
              onClick={() =>
                callApi("Debug Session", "/api/v1/debug/auth/session", "GET")
              }
            >
              Debug Session
            </button>
          </div>
        </section>

        {/* Security testing */}
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
      </section>

      <section className="output-column">
        {/* Response output */}
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
      </section>
    </main>
  );
}
