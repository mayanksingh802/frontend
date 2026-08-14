"use client";

import {
  Plus,
  Grid3X3,
  Search,
  Bell,
  Settings,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  sectionNavigation,
} from "@/app/config/navigation";

export default function DashboardNavbar() {
  const pathname = usePathname();

  const section =
    pathname.startsWith("/dashboard/system-settings")
      ? sectionNavigation["/dashboard/system-settings"]
      : sectionNavigation["/dashboard"];

  return (
    <>
      <header className="dashboard-navbar">
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

          <button className="navbar-icon-button">
            <Settings size={20} />
          </button>

          <button className="navbar-profile">
            S
          </button>
        </div>
      </header>

      {/* Second navigation row */}
      <div className="dashboard-tabs">
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
      </div>
    </>
  );
}
