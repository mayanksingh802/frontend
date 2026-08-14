"use client";

import { useMemo, useState } from "react";
import { Filter, Plus, Search } from "lucide-react";
import Link from "next/link";
import {
  serviceHubs,
  type ServiceHubItem,
} from "@/app/config/service-hubs";

interface ServiceHubProps {
  hub: keyof typeof serviceHubs;
}

function ServiceCard({ service }: { service: ServiceHubItem }) {
  const Icon = service.icon;
  const content = (
    <>
      <Icon size={36} strokeWidth={2.2} />
      <span>{service.label}</span>
    </>
  );
  const className = `service-hub-card service-hub-card-${service.tone}`;

  return service.href ? (
    <Link href={service.href} className={className}>
      {content}
    </Link>
  ) : (
    <div className={className}>{content}</div>
  );
}

export default function ServiceHub({ hub }: ServiceHubProps) {
  const config = serviceHubs[hub];
  const [query, setQuery] = useState("");
  const visibleServices = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return normalizedQuery
      ? config.services.filter((service) =>
          service.label.toLowerCase().includes(normalizedQuery)
        )
      : config.services;
  }, [config.services, query]);

  return (
    <section className="service-hub">
      <div className="service-hub-company-card">
        <div className="service-hub-company-mark">TC</div>
        <div>
          <h1>TechCushy Software Solutions Private Limited</h1>
          <div className="service-hub-license">
            <span>User License Usage</span>
            <div aria-label="User license usage: 40%" className="service-hub-license-track">
              <span />
            </div>
          </div>
        </div>
        <div className="service-hub-account">
          <strong>F49F1AE7 - System</strong>
          <span>Super Administrator</span>
        </div>
      </div>

      <div className="service-hub-panel">
        <div className="service-hub-panel-header">
          <h2>Services</h2>
          <div className="service-hub-search-row">
            <label className="service-hub-search">
              <Search size={22} />
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search services"
              />
            </label>
            <button type="button" className="service-hub-filter" aria-label="Filter services">
              <Filter size={22} />
            </button>
          </div>
        </div>

        <div className="service-hub-grid">
          {visibleServices.map((service) => (
            <ServiceCard key={service.label} service={service} />
          ))}
        </div>

        {!visibleServices.length && (
          <p className="service-hub-empty">No services match your search.</p>
        )}
      </div>

      {config.showCustomServices && (
        <div className="service-hub-panel service-hub-custom-panel">
          <h2>Custom Services</h2>
          <button type="button" className="service-hub-add-card">
            <Plus size={34} />
            <span>Add custom service</span>
          </button>
        </div>
      )}
    </section>
  );
}
