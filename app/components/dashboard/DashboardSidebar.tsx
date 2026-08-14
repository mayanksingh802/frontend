"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { navigationItems } from "@/app/config/navigation";
import ThemeToggle from "@/app/components/theme/ThemeToggle";
import { useAuth } from "@/app/context/AuthContext";
export default function DashboardSidebar() {
  const pathname = usePathname();
  const { hasAnyRole } = useAuth();
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

            const isActive =
              pathname === item.href || pathname.startsWith(`${item.href}/`);

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
