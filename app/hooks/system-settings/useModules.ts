"use client";

import { useCallback, useEffect, useState } from "react";
import { moduleService } from "@/app/services/system-settings/moduleService";
import { Module } from "@/app/types/system-settings/module";

interface UseModulesReturn {
  modules: Module[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useModules(): UseModulesReturn {
  const [modules, setModules] = useState<Module[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchModules = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const data = await moduleService.getModules();

      setModules(data);
    } catch (error) {
      console.error("Failed to load modules:", error);

      setError(
        error instanceof Error
          ? error.message
          : "Failed to load modules"
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchModules();
  }, [fetchModules]);

  return {
    modules,
    loading,
    error,
    refresh: fetchModules,
  };
}