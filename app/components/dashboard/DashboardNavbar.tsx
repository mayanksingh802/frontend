"use client";

import { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  Bell,
  Grid3X3,
  LogOut,
  Plus,
  Search,
  Settings,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  sectionNavigation,
} from "@/app/config/navigation";
import { useAuth } from "@/app/context/AuthContext";

export default function DashboardNavbar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, logout } = useAuth();
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);
  const userInitial = user?.displayName?.charAt(0).toUpperCase() ?? "U";
  const userDisplayName = user?.displayName ?? "User";
  const userEmail = user?.email ?? "";
  const isManageAccounts = pathname.startsWith("/admin/organization-setup");
  const manageSection = searchParams.get("section") ?? "organization-setup";
  const manageNavigation = [
    ["users", "Users"],
    ["organization-setup", "Organization Setup"],
    ["access-control", "User Access Control"],
    ["manage-service", "Manage Service"],
    ["automation", "Automation"],
    ["approvals", "Approvals"],
    ["subscription", "Subscription"],
  ];
  const isServiceHub =
    pathname.startsWith("/dashboard/settings") ||
    pathname.startsWith("/dashboard/operations");

  const section =
    pathname.startsWith("/dashboard/system-settings")
      ? sectionNavigation["/dashboard/system-settings"]
      : pathname.startsWith("/dashboard/settings")
        ? sectionNavigation["/dashboard/settings"]
        : pathname.startsWith("/dashboard/operations")
          ? sectionNavigation["/dashboard/operations"]
      : sectionNavigation["/dashboard"];

  useEffect(() => {
    if (!isProfileMenuOpen) {
      return;
    }

    const handleClickOutside = (event: MouseEvent) => {
      if (
        profileMenuRef.current &&
        !profileMenuRef.current.contains(event.target as Node)
      ) {
        setIsProfileMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isProfileMenuOpen]);

  const handleLogout = async () => {
    setIsProfileMenuOpen(false);
    await logout();
    router.push("/login");
  };

  return (
    <>
      {isManageAccounts ? (
        <header className="manage-accounts-navbar">
          <Link href="/dashboard/settings" className="manage-accounts-back-link">
            <ArrowLeft size={21} />
            <span>Manage Accounts</span>
          </Link>
          <nav className="manage-accounts-top-navigation" aria-label="Manage account sections">
            {manageNavigation.map(([id, label]) => (
              <Link
                key={id}
                href={id === "organization-setup" ? "/admin/organization-setup" : `/admin/organization-setup?section=${id}`}
                className={manageSection === id ? "active" : ""}
              >
                {label}
              </Link>
            ))}
          </nav>
          <div className="manage-accounts-actions">
            <button type="button" className="manage-accounts-add" aria-label="Add"><Plus size={20} /></button>
            <button type="button" aria-label="Search"><Search size={21} /></button>
            <button type="button" aria-label="Notifications"><Bell size={20} /></button>
            <Link href="/dashboard/settings" aria-label="Settings"><Settings size={20} /></Link>
          </div>
        </header>
      ) : (
      <header
        className={`dashboard-navbar ${
          isServiceHub ? "dashboard-navbar-service-hub" : ""
        }`}
      >
        {/* Left side */}
        <div className="navbar-left">
          <div className="navbar-section">
            {section.topNavigation ? (
              <div className="top-navigation">
                {section.topNavigation.map((item) => {
                  const active =
                    pathname === item.href ||
                    pathname.startsWith(`${item.href}/`);

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`top-navigation-item ${
                        active
                          ? "top-navigation-item-active"
                          : ""
                      }`}
                    >
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            ) : (
              <div className="navbar-title">
                <h1>{section.title}</h1>

                {section.subtitle && (
                  <p>{section.subtitle}</p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right side */}
        <div className="navbar-actions">
          <button className="navbar-add-button">
            <Plus size={24} />
          </button>

          <button className="navbar-icon-button">
            <Grid3X3 size={20} />
          </button>

          <button className="navbar-icon-button">
            <Search size={21} />
          </button>

          <button className="navbar-icon-button">
            <Bell size={20} />
          </button>

          <Link
            href="/dashboard/settings"
            className={`navbar-icon-button ${
              pathname.startsWith("/dashboard/settings") ||
              pathname.startsWith("/dashboard/operations")
                ? "active"
                : ""
            }`}
            aria-label="Settings"
          >
            <Settings size={20} />
          </Link>

          <div className="navbar-profile-wrapper" ref={profileMenuRef}>
            <button
              className="navbar-profile"
              onClick={() => setIsProfileMenuOpen((open) => !open)}
              aria-label="Profile menu"
              aria-expanded={isProfileMenuOpen}
            >
              {userInitial}
            </button>

            {isProfileMenuOpen && (
              <div className="navbar-profile-menu">
                <div className="navbar-profile-menu-header">
                  <div className="navbar-profile-avatar">{userInitial}</div>
                  <div className="navbar-profile-info">
                    <strong>{userDisplayName}</strong>
                    <span>{userEmail}</span>
                  </div>
                </div>
                <div className="navbar-profile-menu-divider" />
                <button
                  type="button"
                  className="navbar-profile-logout"
                  onClick={handleLogout}
                >
                  <LogOut size={16} />
                  <span>Logout</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>
      )}

      {/* Second navigation row */}
      {!isManageAccounts && section.tabs?.length ? <div className="dashboard-tabs">
        <div className="dashboard-tabs-inner">
          {section.tabs?.map((tab) => {
            const active =
              pathname === tab.href ||
              pathname.startsWith(`${tab.href}/`);

            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={`dashboard-tab ${
                  active ? "dashboard-tab-active" : ""
                }`}
              >
                {tab.label}
              </Link>
            );
          })}
        </div>
      </div> : null}
    </>
  );
}