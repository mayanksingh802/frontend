import RoleGuard from "@/app/components/auth/RoleGuard";
import KeyValueManagement from "@/app/components/key-values/KeyValueManagement";
import { permissions } from "@/app/config/permissions";

export default function KeyValuePage() {
  return (
    <RoleGuard allowedRoles={permissions.keyValueManagement}>
      <KeyValueManagement />
    </RoleGuard>
  );
}
