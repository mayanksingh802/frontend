import type { KeyValue } from "@/app/types/system-settings/keyValue";

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
};
