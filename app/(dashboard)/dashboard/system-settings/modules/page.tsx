import RoleGuard from "@/app/components/auth/RoleGuard";
import ModuleManagement from "@/app/components/modules/ModuleManagement";
import { permissions } from "@/app/config/permissions";

export default function ModulesPage() {
  return (
    <RoleGuard allowedRoles={permissions.moduleManagement}>
      <ModuleManagement />
    </RoleGuard>
  );
}
