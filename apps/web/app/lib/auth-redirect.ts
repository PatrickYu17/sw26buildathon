export function sanitizeNextPath(nextPath: string | null | undefined): string | null {
  if (!nextPath) return null;
  if (!nextPath.startsWith("/")) return null;
  if (nextPath.startsWith("//")) return null;
  return nextPath;
}

export function buildLoginRedirectPath(nextPath: string): string {
  const safeNext = sanitizeNextPath(nextPath) ?? "/";
  return `/login?next=${encodeURIComponent(safeNext)}`;
}
