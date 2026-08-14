"use client";

import { useCallback, useEffect, useState } from "react";
import { keyNameService } from "@/app/services/system-settings/keyNameService";
import type { KeyName } from "@/app/types/system-settings/keyName";

interface UseKeyNamesReturn {
  keyNames: KeyName[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useKeyNames(): UseKeyNamesReturn {
  const [keyNames, setKeyNames] = useState<KeyName[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchKeyNames = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      setKeyNames(await keyNameService.getKeyNames());
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Failed to load key names."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchKeyNames();
  }, [fetchKeyNames]);

  return { keyNames, loading, error, refresh: fetchKeyNames };
}
