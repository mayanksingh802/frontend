"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export interface UseListDataResult<T> {
  items: T[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useListData<T>(
  fetcher: () => Promise<T[]>,
  defaultErrorMessage: string,
  onError?: (error: unknown) => void
): UseListDataResult<T> {
  const [items, setItems] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const onErrorRef = useRef(onError);

  useEffect(() => {
    onErrorRef.current = onError;
  }, [onError]);

  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      setItems(await fetcher());
    } catch (error) {
      onErrorRef.current?.(error);
      setError(
        error instanceof Error ? error.message : defaultErrorMessage
      );
    } finally {
      setLoading(false);
    }
  }, [defaultErrorMessage, fetcher]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { items, loading, error, refresh };
}
