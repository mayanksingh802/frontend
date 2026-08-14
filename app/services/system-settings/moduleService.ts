import type { Module } from "@/app/types/system-settings/module";

export interface CreateModuleInput {
  code: string;
  name: string;
}

export interface UpdateModuleInput extends CreateModuleInput {
  remark: string;
  status: Module["status"];
}

export const moduleService = {
  async getModules(): Promise<Module[]> {
    const response = await fetch(
      "/api/system-settings/modules",
      {
        cache: "no-store",
      }
    );

    if (!response.ok) {
      const body = await response.json().catch(() => null);

      throw new Error(
        body?.message ??
          `Failed to fetch modules: ${response.status}`
      );
    }

    return response.json();
  },

  async addModule(input: CreateModuleInput): Promise<Module> {
    const response = await fetch("/api/system-settings/modules", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(input),
    });

    if (!response.ok) {
      const body = await response.json().catch(() => null);

      throw new Error(
        body?.message ?? `Failed to add module: ${response.status}`
      );
    }

    return response.json();
  },

  async deleteModule(id: string): Promise<void> {
    const response = await fetch(
      `/api/system-settings/modules/${encodeURIComponent(id)}`,
      { method: "DELETE" }
    );

    if (!response.ok) {
      const body = await response.json().catch(() => null);

      throw new Error(
        body?.message ?? `Failed to delete module: ${response.status}`
      );
    }
  },

  async updateModule(id: string, input: UpdateModuleInput): Promise<void> {
    const response = await fetch(
      `/api/system-settings/modules/${encodeURIComponent(id)}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(input),
      }
    );

    if (!response.ok) {
      const body = await response.json().catch(() => null);

      throw new Error(
        body?.message ?? `Failed to update module: ${response.status}`
      );
    }
  },
};
