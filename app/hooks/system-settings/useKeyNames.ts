"use client";

import { useCallback } from "react";
import { keyNameService } from "@/app/services/system-settings/keyNameService";
import type { KeyName } from "@/app/types/system-settings/keyName";
import { useListData } from "@/app/hooks/system-settings/useListData";

interface UseKeyNamesReturn {
  keyNames: KeyName[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useKeyNames(): UseKeyNamesReturn {
  const fetchKeyNames = useCallback(() => keyNameService.getKeyNames(), []);

  const { items: keyNames, loading, error, refresh } = useListData(
    fetchKeyNames,
    "Failed to load key names."
  );

  return { keyNames, loading, error, refresh };
}
