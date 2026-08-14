import { Home, Server } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { permissions } from "@/app/config/permissions";
import type { Role } from "@/app/types/auth/auth";

export interface NavigationItem {
  label: string;
  href: string;
  icon: LucideIcon;
  allowedRoles?: Role[];
}


export interface NavigationLink {
  label: string;
  href: string;
}

export interface SectionNavigation {
  title: string;
  subtitle?: string;
  topNavigation?: NavigationLink[];
  tabs?: NavigationLink[];
}

export const navigationItems: NavigationItem[] = [
  {
    label: "Home",
    href: "/dashboard",
    icon: Home,
  },
  {
    label: "System Settings",
    href: "/dashboard/system-settings",
    icon: Server,
    allowedRoles: permissions.systemSettings,
  },
];

export const sectionNavigation: Record<
  string,
  SectionNavigation
> = {
  "/dashboard": {
    title: "My Space",

    topNavigation: [
      {
        label: "My Space",
        href: "/dashboard",
      },
      {
        label: "Team",
        href: "/dashboard/team",
      },
      {
        label: "Organization",
        href: "/dashboard/organization",
      },
    ],

    tabs: [
      {
        label: "Overview",
        href: "/dashboard",
      },
      {
        label: "Dashboard",
        href: "/dashboard/overview",
      },
      {
        label: "Calendar",
        href: "/dashboard/calendar",
      },
      {
        label: "Delegation",
        href: "/dashboard/delegation",
      },
    ],
  },

  "/dashboard/system-settings": {
    title: "System Settings",

    tabs: [
      {
        label: "Modules",
        href: "/dashboard/system-settings/modules",
      },
      {
        label: "Key Name",
        href: "/dashboard/system-settings/key-name",
      },
      {
        label: "Key Value",
        href: "/dashboard/system-settings/key-value",
      },
    ],
  },
};