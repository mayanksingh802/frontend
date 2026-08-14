import type { ModuleStatus } from "@/app/types/system-settings/module";

export default function StatusBadge({ status }: { status: ModuleStatus }) {
  return (
    <span className={`module-status module-status-${status.toLowerCase()}`}>
      {status}
    </span>
  );
}
