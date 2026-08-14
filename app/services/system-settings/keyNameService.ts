import type { KeyName } from "@/app/types/system-settings/keyName";

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
};
