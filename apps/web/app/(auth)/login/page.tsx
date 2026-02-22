"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { authClient } from "@/app/lib/auth-client";
import { sanitizeNextPath } from "@/app/lib/auth-redirect";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const { error: signInError } = await authClient.signIn.email({
      email,
      password,
    });

    setIsSubmitting(false);

    if (signInError) {
      setError(signInError.message || "Invalid email or password.");
      return;
    }

    const nextParam =
      typeof window === "undefined"
        ? null
        : new URLSearchParams(window.location.search).get("next");
    const nextPath = sanitizeNextPath(nextParam) ?? "/";
    router.push(nextPath);
  };

  return (
    <main className="mx-auto flex min-h-[calc(100vh-8.5rem)] w-full max-w-6xl items-center py-10">
      <section className="grid w-full overflow-hidden rounded-none border border-border bg-white shadow-[0_24px_60px_-36px_rgba(61,54,84,0.42)] lg:grid-cols-[1.1fr_0.9fr]">
        <div className="relative overflow-hidden border-b border-border bg-linear-to-br from-accent-light via-rose-light to-accent-warm p-8 sm:p-10 lg:border-r lg:border-b-0">
          <div
            className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-white/45 blur-2xl"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute -left-12 bottom-8 h-40 w-40 rounded-full bg-white/50 blur-2xl"
            aria-hidden
          />

          <div className="relative max-w-md space-y-7">
            <p className="inline-flex items-center rounded-full border border-accent/20 bg-white/70 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-accent-muted">
              Relationship ORM
            </p>
            <div className="space-y-3">
              <h1 className="text-3xl font-semibold leading-tight text-foreground sm:text-4xl">
                Welcome back.
                <br />
                Continue where you left off.
              </h1>
              <p className="text-sm leading-relaxed text-foreground/80 sm:text-base">
                Sign in to review upcoming reminders, conversations, and action items across your relationship hub.
              </p>
            </div>

          </div>
        </div>

        <div className="p-7 sm:p-10">
          <div className="mx-auto w-full max-w-md space-y-6">
            <div className="space-y-1">
              <h2 className="text-2xl font-semibold text-foreground">Sign in</h2>
              <p className="text-sm text-text-muted">Use your email and password to access your account.</p>
            </div>

            <form onSubmit={onSubmit} className="space-y-4">
              <label className="block space-y-1.5">
                <span className="text-sm font-medium text-foreground">Email</span>
                <input
                  type="email"
                  className="w-full rounded-none border border-border bg-white px-3 py-2.5 text-sm text-foreground outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/25"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  autoComplete="email"
                  required
                />
              </label>

              <label className="block space-y-1.5">
                <span className="text-sm font-medium text-foreground">Password</span>
                <input
                  type="password"
                  className="w-full rounded-none border border-border bg-white px-3 py-2.5 text-sm text-foreground outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/25"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  autoComplete="current-password"
                  required
                />
              </label>

              {error ? (
                <p className="rounded-none border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700" role="alert" aria-live="polite">
                  {error}
                </p>
              ) : null}

              <button
                type="submit"
                className="w-full rounded-none bg-accent px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-accent-muted disabled:cursor-not-allowed disabled:opacity-60"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Signing in..." : "Sign in"}
              </button>
            </form>

            <p className="text-sm text-text-muted">
              Need an account?{" "}
              <Link href="/register" className="font-semibold text-accent-muted underline underline-offset-2">
                Create one
              </Link>
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
