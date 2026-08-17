import type { LucideIcon } from "lucide-react";
import {
  Briefcase,
  CalendarClock,
  CalendarDays,
  ChartNoAxesCombined,
  Clock3,
  Code2,
  DollarSign,
  Folder,
  GraduationCap,
  Heart,
  ListChecks,
  Plane,
  Settings,
  Store,
  UserCheck,
  UserPlus,
  UserSquare,
  UsersRound,
} from "lucide-react";
import { permissions } from "@/app/config/permissions";
import type { Role } from "@/app/types/auth/auth";

export type ServiceHubTone = "green" | "blue" | "gold" | "slate";

export interface ServiceHubItem {
  label: string;
  icon: LucideIcon;
  tone: ServiceHubTone;
  href?: string;
  allowedRoles?: Role[];
}

export interface ServiceHubConfig {
  title: string;
  services: ServiceHubItem[];
  showCustomServices?: boolean;
}

const sharedServices: ServiceHubItem[] = [
  {
    label: "Manage Accounts",
    icon: UsersRound,
    tone: "green",
    href: "/admin/organization-setup",
    allowedRoles: permissions.systemSettings,
  },
  { label: "Leave Tracker", icon: CalendarClock, tone: "blue" },
  { label: "Time Tracker", icon: Clock3, tone: "gold" },
  { label: "Attendance", icon: UserCheck, tone: "green" },
  { label: "Shifts", icon: CalendarDays, tone: "blue" },
  { label: "Files", icon: Folder, tone: "gold" },
  { label: "Employee Information", icon: UserSquare, tone: "blue" },
  { label: "Training", icon: GraduationCap, tone: "green" },
  { label: "Travel", icon: Plane, tone: "blue" },
  { label: "Compensation", icon: DollarSign, tone: "green" },
  { label: "Performance", icon: ChartNoAxesCombined, tone: "gold" },
  { label: "Tasks", icon: ListChecks, tone: "blue" },
  { label: "Cases", icon: Briefcase, tone: "blue" },
  { label: "Onboarding", icon: UserPlus, tone: "green" },
  { label: "Employee Engagement", icon: Heart, tone: "gold" },
  { label: "General", icon: Settings, tone: "slate" },
  { label: "Marketplace", icon: Store, tone: "blue" },
  { label: "Developer Space", icon: Code2, tone: "blue" },
];

export const serviceHubs: Record<"settings" | "operations", ServiceHubConfig> = {
  settings: {
    title: "Settings",
    showCustomServices: true,
    services: sharedServices,
  },
  operations: {
    title: "Operations",
    services: sharedServices,
  },
};
