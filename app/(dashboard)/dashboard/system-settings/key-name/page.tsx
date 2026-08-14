import RoleGuard from "@/app/components/auth/RoleGuard";
import KeyNameManagement from "@/app/components/key-names/KeyNameManagement";
import { permissions } from "@/app/config/permissions";

export default function KeyNamePage() {
  return (
    <RoleGuard allowedRoles={permissions.keyNameManagement}>
      <KeyNameManagement />
    </RoleGuard>
  );
}
