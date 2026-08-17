"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { navigationItems } from "@/app/config/navigation";
import { organizationSetupSections } from "@/app/config/organization-setup";
import { ChevronDown, Settings } from "lucide-react";
import ThemeToggle from "@/app/components/theme/ThemeToggle";
import { useAuth } from "@/app/context/AuthContext";

export default function DashboardSidebar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { hasAnyRole } = useAuth();
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});
  const isOrganizationSetup = pathname.startsWith("/admin/organization-setup");
  const manageSection = searchParams.get("section") ?? "organization-setup";

  useEffect(() => {
    if (!isOrganizationSetup) {
      return;
    }

    setExpandedSections((current) => {
      const nextState: Record<string, boolean> = { ...current };

      const expandPath = (section: (typeof organizationSetupSections)[number]) => {
        if (!section.children?.length) {
          return;
        }

        const shouldExpand =
          manageSection === section.id ||
          section.children.some((child) => {
            if (child.id === manageSection) {
              return true;
            }

            return child.children?.some((grandChild) => grandChild.id === manageSection) ?? false;
          });

        nextState[section.id] = shouldExpand;
        section.children.forEach((child) => expandPath(child));
      };

      organizationSetupSections.forEach((section) => expandPath(section));
      return nextState;
    });
  }, [isOrganizationSetup, manageSection]);

  const toggleSection = (sectionId: string) => {
    setExpandedSections((current) => ({
      ...current,
      [sectionId]: !(current[sectionId] ?? false),
    }));
  };

  const handleOrganizationSectionClick = (section: (typeof organizationSetupSections)[number]) => {
    const nextExpanded = !(expandedSections[section.id] ?? false);

    setExpandedSections((current) => ({
      ...current,
      [section.id]: nextExpanded,
    }));

    if (!nextExpanded) {
      return;
    }

    router.push(section.href ?? "/admin/organization-setup");
  };

  const renderSection = (
    section: (typeof organizationSetupSections)[number],
    depth = 0,
  ) => {
    const isActive = manageSection === section.id;
    const isExpandable = Boolean(section.children?.length);
    const isExpanded =
      Boolean(expandedSections[section.id]) ||
      (isExpandable &&
        section.children?.some((child) => {
          if (child.id === manageSection) {
            return true;
          }

          return child.children?.some((grandChild) => grandChild.id === manageSection) ?? false;
        }));

    return (
      <div key={section.id} className="manage-accounts-nav-group" style={{ marginLeft: depth > 0 ? 12 : 0 }}>
        {isExpandable ? (
          <button
            type="button"
            className={`manage-accounts-nav-item ${
              isActive ? "active" : ""
            } manage-accounts-nav-expandable`}
            onClick={() => {
              if (section.id === "organization") {
                handleOrganizationSectionClick(section);
                return;
              }

              toggleSection(section.id);
            }}
            aria-expanded={isExpanded}
          >
            {section.label}
            <ChevronDown
              size={19}
              className={isExpanded ? "manage-accounts-chevron-open" : ""}
            />
          </button>
        ) : (
          <Link
            href={section.href ?? "/admin/organization-setup"}
            className={`manage-accounts-nav-item ${
              isActive ? "active" : ""
            }`}
          >
            {section.label}
          </Link>
        )}

        {isExpandable && isExpanded && (
          <div className="manage-accounts-nav-children">
            {section.children?.map((child) => renderSection(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  if (isOrganizationSetup) {
    return (
      <aside className="manage-accounts-sidebar">
        <nav className="manage-accounts-navigation" aria-label="Manage account navigation">
          {organizationSetupSections.map((section) => renderSection(section))}
        </nav>

        <Link href="/dashboard/operations" className="manage-accounts-operations-link">
          <Settings size={21} />
          Go to Settings
        </Link>
      </aside>
    );
  }

  return (
    <aside className="dashboard-sidebar">
      <div className="sidebar-logo">
        <div className="logo-mark">
          <span>C</span>
        </div>
      </div>

      <nav className="sidebar-navigation">
        {navigationItems
          .filter((item) => !item.allowedRoles || hasAnyRole(item.allowedRoles))
          .map((item) => {
            const Icon = item.icon;

            const isOperations =
              item.href === "/dashboard/operations" &&
              (pathname.startsWith("/dashboard/operations") ||
                pathname.startsWith("/dashboard/settings"));

            const isHome =
              item.href === "/dashboard" &&
              pathname.startsWith("/dashboard") &&
              !pathname.startsWith("/dashboard/operations") &&
              !pathname.startsWith("/dashboard/settings") &&
              !pathname.startsWith("/dashboard/system-settings");

            const isActive =
              isOperations ||
              isHome ||
              (pathname === item.href || pathname.startsWith(`${item.href}/`));

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`sidebar-item ${
                  isActive ? "sidebar-item-active" : ""
                }`}
              >
                <Icon size={22} strokeWidth={1.8} />

                <span className="sidebar-label">{item.label}</span>
              </Link>
            );
          })}
      </nav>
      <div className="sidebar-bottom">
        <ThemeToggle />
      </div>
    </aside>
  );
}
