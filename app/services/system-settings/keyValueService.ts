import type { KeyValue, KeyValueStatus } from "@/app/types/system-settings/keyValue";

export interface UpdateKeyValueInput {
  key: string;
  value: string;
  remark: string;
  status: KeyValueStatus;
}

export const keyValueService = {
  async getKeyValues(): Promise<KeyValue[]> {
    const response = await fetch("/api/system-settings/key-values", {
      cache: "no-store",
    });

    if (!response.ok) {
      const body = await response.json().catch(() => null);

      throw new Error(
        body?.message ?? `Failed to fetch key values: ${response.status}`
      );
    }

    return response.json();
  },

  async addKeyValue(payload: {
    key: string;
    value: string;
    remark?: string;
  }): Promise<KeyValue> {
    const response = await fetch("/api/system-settings/key-values", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const body = await response.json().catch(() => null);

      throw new Error(
        body?.message ?? `Failed to add key value: ${response.status}`
      );
    }

    return response.json();
  },

  async updateKeyValue(id: string, input: UpdateKeyValueInput): Promise<void> {
    const response = await fetch(
      `/api/system-settings/key-values/${encodeURIComponent(id)}`,
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
        body?.message ?? `Failed to update key value: ${response.status}`
      );
    }
  },

  async deleteKeyValue(id: string): Promise<void> {
    const response = await fetch(
      `/api/system-settings/key-values/${encodeURIComponent(id)}`,
      { method: "DELETE" }
    );

    if (!response.ok) {
      const body = await response.json().catch(() => null);

      throw new Error(
        body?.message ?? `Failed to delete key value: ${response.status}`
      );
    }
  },
};
