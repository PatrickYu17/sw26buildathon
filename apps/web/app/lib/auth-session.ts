import "server-only";
import { headers } from "next/headers";

const DEFAULT_AUTH_URL = "http://localhost:3001/api/auth";

type SessionResponse = {
  authenticated?: boolean;
};

function getBackendBaseUrl() {
  const authUrl = process.env.NEXT_PUBLIC_AUTH_URL || DEFAULT_AUTH_URL;
  return authUrl.replace(/\/api\/auth\/?$/, "");
}

export async function isAuthenticatedRequest() {
  const requestHeaders = await headers();
  const cookie = requestHeaders.get("cookie") ?? "";

  try {
    const response = await fetch(`${getBackendBaseUrl()}/api/v1/auth/status`, {
      headers: cookie ? { cookie } : {},
      cache: "no-store",
    });

    if (!response.ok) {
      return false;
    }

    const data = (await response.json()) as SessionResponse;
    return Boolean(data.authenticated);
  } catch {
    return false;
  }
}
