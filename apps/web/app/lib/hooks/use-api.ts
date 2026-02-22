"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { buildLoginRedirectPath } from "@/app/lib/auth-redirect";
import { isApiRequestError } from "@/app/lib/api";

function redirectToLogin() {
  if (typeof window === "undefined") return;
  const nextPath = `${window.location.pathname}${window.location.search}`;
  window.location.assign(buildLoginRedirectPath(nextPath));
}

export function useApi<T>(
  fetcher: () => Promise<T>,
  deps: unknown[] = [],
) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const mountedRef = useRef(true);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetcher();
      if (mountedRef.current) setData(result);
    } catch (err) {
      if (isApiRequestError(err) && err.status === 401) {
        redirectToLogin();
        return;
      }
      if (mountedRef.current) setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, deps); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    mountedRef.current = true;
    refetch();
    return () => {
      mountedRef.current = false;
    };
  }, [refetch]);

  return { data, error, loading, refetch };
}

export function useMutation<TInput, TOutput>(
  mutator: (input: TInput) => Promise<TOutput>,
) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mutate = useCallback(
    async (input: TInput): Promise<TOutput | null> => {
      setLoading(true);
      setError(null);
      try {
        const result = await mutator(input);
        return result;
      } catch (err) {
        if (isApiRequestError(err) && err.status === 401) {
          redirectToLogin();
          return null;
        }
        const msg = err instanceof Error ? err.message : "Unknown error";
        setError(msg);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [mutator],
  );

  return { mutate, loading, error };
}
