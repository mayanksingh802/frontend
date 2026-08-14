"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { navigationItems } from "@/app/config/navigation";
import { ChevronDown, Settings } from "lucide-react";
import ThemeToggle from "@/app/components/theme/ThemeToggle";
import { useAuth } from "@/app/context/AuthContext";
export default function DashboardSidebar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { hasAnyRole } = useAuth();
  if (pathname.startsWith("/admin/organization-setup")) {
    const manageSection = searchParams.get("section") ?? "organization-setup";
    const manageLink = (section: string) => section === "organization-setup"
      ? "/admin/organization-setup"
      : `/admin/organization-setup?section=${section}`;
    return (
      <aside className="manage-accounts-sidebar">
        <div className="manage-accounts-company">
          <strong>CORPIZ</strong>
          <span>CORPIZ</span>
        </div>

        <nav className="manage-accounts-navigation" aria-label="Manage account navigation">
          <Link href={manageLink("organization-setup")} className={`manage-accounts-nav-item ${manageSection === "organization-setup" ? "active" : ""}`}>
            Organization Details
          </Link>
          <Link href={manageLink("organization-policy")} className={`manage-accounts-nav-item ${manageSection === "organization-policy" ? "active" : ""}`}>Organization Policy</Link>
          <Link href={manageLink("organization-structure")} className={`manage-accounts-nav-item manage-accounts-nav-expandable ${manageSection === "organization-structure" ? "active" : ""}`}>
            <span>Organization Structure</span>
            <ChevronDown size={19} />
          </Link>
          <div className="manage-accounts-nav-children">
            <Link href={manageLink("business-unit")}>Business Unit</Link>
            <Link href={manageLink("branch")}>Branch</Link>
            <Link href={manageLink("departments")}>Departments</Link>
            <Link href={manageLink("designations")}>Designations</Link>
          </div>
          <Link href={manageLink("domains-rebranding")} className={`manage-accounts-nav-item ${manageSection === "domains-rebranding" ? "active" : ""}`}>Domains and Rebranding</Link>
          <Link href={manageLink("from-addresses")} className={`manage-accounts-nav-item ${manageSection === "from-addresses" ? "active" : ""}`}>From Addresses</Link>
          <Link href={manageLink("email-authentication")} className={`manage-accounts-nav-item ${manageSection === "email-authentication" ? "active" : ""}`}>Email Authentication</Link>
        </nav>

        <Link href="/dashboard/operations" className="manage-accounts-operations-link">
          <Settings size={21} />
          Go to Operations
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
