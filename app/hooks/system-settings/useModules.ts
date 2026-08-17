"use client";

import { useCallback } from "react";
import { moduleService } from "@/app/services/system-settings/moduleService";
import type { Module } from "@/app/types/system-settings/module";
import { useListData } from "@/app/hooks/system-settings/useListData";

interface UseModulesReturn {
  modules: Module[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useModules(): UseModulesReturn {
  const fetchModules = useCallback(() => moduleService.getModules(), []);

  const { items: modules, loading, error, refresh } = useListData(
    fetchModules,
    "Failed to load modules.",
    (error) => {
      console.error("Failed to load modules:", error);
    }
  );

  return {
    modules,
    loading,
    error,
    refresh,
  };
}