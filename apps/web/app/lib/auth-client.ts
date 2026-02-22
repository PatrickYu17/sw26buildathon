const baseURL =
  process.env.NEXT_PUBLIC_AUTH_URL || "http://localhost:3001/api/auth";

type AuthError = {
  message: string;
  code?: string;
  status?: number;
};

type AuthResponse<T = unknown> = {
  data: T | null;
  error: AuthError | null;
};

function tryParseJson(text: string): Record<string, unknown> | null {
  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text) as Record<string, unknown>;
  } catch {
    return null;
  }
}

async function postAuth<T = unknown>(
  path: string,
  payload: Record<string, unknown>,
): Promise<AuthResponse<T>> {
  try {
    const response = await fetch(`${baseURL}${path}`, {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const text = await response.text();
    const parsed = tryParseJson(text);

    if (!response.ok) {
      const message =
        (parsed?.message as string | undefined) ||
        (parsed?.error as string | undefined) ||
        "Authentication request failed.";

      return {
        data: null,
        error: {
          message,
          code: parsed?.code as string | undefined,
          status: response.status,
        },
      };
    }

    return {
      data: (parsed as T | null) ?? null,
      error: null,
    };
  } catch (error) {
    return {
      data: null,
      error: {
        message:
          error instanceof Error
            ? error.message
            : "Unable to reach authentication service.",
      },
    };
  }
}

export const authClient = {
  signIn: {
    email: (payload: { email: string; password: string }) =>
      postAuth("/sign-in/email", payload),
  },
  signUp: {
    email: (payload: { name: string; email: string; password: string }) =>
      postAuth("/sign-up/email", payload),
  },
};
