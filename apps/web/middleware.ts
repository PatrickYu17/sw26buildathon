import { NextRequest, NextResponse } from "next/server";
import { buildLoginRedirectPath, sanitizeNextPath } from "@/app/lib/auth-redirect";

const AUTH_STATUS_PATH = "/api/v1/auth/status";
const DEFAULT_API_BASE = "http://localhost:3001/api/v1";

const PUBLIC_PATHS = new Set(["/login", "/register"]);

function getBackendBaseUrl() {
  const apiBase = process.env.NEXT_PUBLIC_API_URL || DEFAULT_API_BASE;
  return apiBase.replace(/\/api\/v1\/?$/, "");
}

function isPublicPath(pathname: string) {
  return PUBLIC_PATHS.has(pathname);
}

function isBypassPath(pathname: string) {
  return (
    pathname.startsWith("/api/") ||
    pathname.startsWith("/_next/") ||
    pathname === "/favicon.ico" ||
    pathname.startsWith("/favicon.") ||
    pathname.startsWith("/icon") ||
    pathname.startsWith("/apple-icon") ||
    pathname.startsWith("/sitemap") ||
    pathname.startsWith("/robots")
  );
}

function resolveAuthenticatedRedirectTarget(request: NextRequest) {
  const requested = sanitizeNextPath(request.nextUrl.searchParams.get("next"));
  return requested ?? "/";
}

async function hasValidSession(request: NextRequest) {
  const cookie = request.headers.get("cookie") ?? "";

  try {
    const response = await fetch(`${getBackendBaseUrl()}${AUTH_STATUS_PATH}`, {
      headers: cookie ? { cookie } : {},
      cache: "no-store",
    });

    if (!response.ok) return false;
    const payload = (await response.json()) as { authenticated?: boolean };
    return Boolean(payload.authenticated);
  } catch {
    return false;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  if (isBypassPath(pathname)) {
    return NextResponse.next();
  }

  const authenticated = await hasValidSession(request);
  const isPublic = isPublicPath(pathname);

  if (!authenticated && !isPublic) {
    const nextPath = `${pathname}${search}`;
    const redirectUrl = new URL(buildLoginRedirectPath(nextPath), request.url);
    return NextResponse.redirect(redirectUrl);
  }

  if (authenticated && isPublic) {
    const redirectUrl = new URL(
      resolveAuthenticatedRedirectTarget(request),
      request.url,
    );
    return NextResponse.redirect(redirectUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: "/:path*",
};
