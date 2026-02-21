import { createAuthClient } from "better-auth/react";

const baseURL =
  process.env.NEXT_PUBLIC_AUTH_URL || "http://localhost:3001/api/auth";

export const authClient = createAuthClient({
  baseURL,
  fetchOptions: {
    credentials: "include",
  },
});
