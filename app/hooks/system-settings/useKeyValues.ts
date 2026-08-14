"use client";

import { useCallback, useEffect, useState } from "react";
import { keyValueService } from "@/app/services/system-settings/keyValueService";
import type { KeyValue } from "@/app/types/system-settings/keyValue";

interface UseKeyValuesReturn {
  keyValues: KeyValue[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useKeyValues(): UseKeyValuesReturn {
  const [keyValues, setKeyValues] = useState<KeyValue[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchKeyValues = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      setKeyValues(await keyValueService.getKeyValues());
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Failed to load key values."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchKeyValues();
  }, [fetchKeyValues]);

  return { keyValues, loading, error, refresh: fetchKeyValues };
}
