import type { KeyName, KeyNameStatus } from "@/app/types/system-settings/keyName";

export interface UpdateKeyNameInput {
  name: string;
  remark: string;
  status: KeyNameStatus;
}

export const keyNameService = {
  async getKeyNames(): Promise<KeyName[]> {
    const response = await fetch("/api/system-settings/key-names", {
      cache: "no-store",
    });

    if (!response.ok) {
      const body = await response.json().catch(() => null);

      throw new Error(
        body?.message ?? `Failed to fetch key names: ${response.status}`
      );
    }

    return response.json();
  },

  async addKeyName(payload: {
    name: string;
    remark?: string;
  }): Promise<KeyName> {
    const response = await fetch("/api/system-settings/key-names", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const body = await response.json().catch(() => null);

      throw new Error(
        body?.message ?? `Failed to add key name: ${response.status}`
      );
    }

    return response.json();
  },

  async updateKeyName(id: string, input: UpdateKeyNameInput): Promise<void> {
    const response = await fetch(
      `/api/system-settings/key-names/${encodeURIComponent(id)}`,
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
        body?.message ?? `Failed to update key name: ${response.status}`
      );
    }
  },

  async deleteKeyName(id: string): Promise<void> {
    const response = await fetch(
      `/api/system-settings/key-names/${encodeURIComponent(id)}`,
      { method: "DELETE" }
    );

    if (!response.ok) {
      const body = await response.json().catch(() => null);

      throw new Error(
        body?.message ?? `Failed to delete key name: ${response.status}`
      );
    }
  },
};
