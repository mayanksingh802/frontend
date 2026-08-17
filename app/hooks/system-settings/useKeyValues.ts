"use client";

import { useCallback } from "react";
import { keyValueService } from "@/app/services/system-settings/keyValueService";
import type { KeyValue } from "@/app/types/system-settings/keyValue";
import { useListData } from "@/app/hooks/system-settings/useListData";

interface UseKeyValuesReturn {
  keyValues: KeyValue[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useKeyValues(): UseKeyValuesReturn {
  const fetchKeyValues = useCallback(() => keyValueService.getKeyValues(), []);

  const { items: keyValues, loading, error, refresh } = useListData(
    fetchKeyValues,
    "Failed to load key values."
  );

  return { keyValues, loading, error, refresh };
}
