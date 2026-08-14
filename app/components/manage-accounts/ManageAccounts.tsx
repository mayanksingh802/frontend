"use client";

import { ImagePlus, Plus, X } from "lucide-react";
import Image from "next/image";
import { ChangeEvent, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";

export default function ManageAccounts() {
  const searchParams = useSearchParams();
  const activeSection = searchParams.get("section") ?? "organization-setup";
  const inputRef = useRef<HTMLInputElement>(null);
  const [logo, setLogo] = useState<string | null>(null);
  const [organizationName, setOrganizationName] = useState("CORPIZ");
  const [domainInput, setDomainInput] = useState("");
  const [domains, setDomains] = useState(["corpiz.com"]);
  const [gstRecords, setGstRecords] = useState<string[]>([]);
  const [saved, setSaved] = useState(false);

  function uploadLogo(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (file) setLogo(URL.createObjectURL(file));
  }

  function addDomain() {
    const domain = domainInput.trim().replace(/^https?:\/\//, "");
    if (domain && !domains.includes(domain)) setDomains((current) => [...current, domain]);
    setDomainInput("");
  }

  const sectionDetails: Record<string, { title: string; description: string }> = {
    users: { title: "Users", description: "Manage organization users and their account details." },
    "access-control": { title: "User Access Control", description: "Configure roles, permissions, and access policies." },
    "manage-service": { title: "Manage Service", description: "Choose the services available to your organization." },
    automation: { title: "Automation", description: "Create rules that streamline your organization workflows." },
    approvals: { title: "Approvals", description: "Set up approval flows and assign approvers." },
    subscription: { title: "Subscription", description: "Review your plan, licenses, and subscription details." },
    "organization-policy": { title: "Organization Policy", description: "Define policies that apply across your organization." },
    "organization-structure": { title: "Organization Structure", description: "Manage the structure of your organization." },
    "business-unit": { title: "Business Unit", description: "Create and manage business units." },
    branch: { title: "Branch", description: "Create and manage branches." },
    departments: { title: "Departments", description: "Create and manage departments." },
    designations: { title: "Designations", description: "Create and manage designations." },
    "domains-rebranding": { title: "Domains and Rebranding", description: "Manage domains and your organization's branding." },
    "from-addresses": { title: "From Addresses", description: "Manage approved sender addresses." },
    "email-authentication": { title: "Email Authentication", description: "Configure authentication for your organization emails." },
  };

  if (activeSection !== "organization-setup") {
    const content = sectionDetails[activeSection] ?? sectionDetails["organization-policy"];

    return (
      <section className="manage-accounts-page">
        <div className="manage-accounts-card manage-accounts-placeholder-card">
          <p className="manage-accounts-eyebrow">MANAGE ACCOUNTS</p>
          <h1>{content.title}</h1>
          <p>{content.description}</p>
          <button type="button" className="manage-accounts-save">Configure {content.title}</button>
        </div>
      </section>
    );
  }

  return (
    <section className="manage-accounts-page">
      <div className="manage-accounts-card">
        <div className="manage-accounts-card-header">
          <div>
            <h1>Organization Profile</h1>
            <p>Company Code: <strong>CORPIZ</strong></p>
          </div>
          <div className="manage-accounts-code">CORPIZ</div>
        </div>

        <div className="manage-accounts-logo-row">
          <button type="button" className="manage-accounts-logo-upload" onClick={() => inputRef.current?.click()}>
            {logo ? <Image src={logo} alt="Organization logo" fill unoptimized /> : <><ImagePlus size={45} /><span>Upload Logo</span></>}
          </button>
          <input ref={inputRef} className="manage-accounts-file-input" type="file" accept="image/png,image/jpeg,image/gif,image/bmp" onChange={uploadLogo} />
          <ul>
            <li>Preferred image dimensions: 240 × 240 pixels @ 72 DPI</li>
            <li>Supported formats: JPG, JPEG, PNG, GIF, BMP</li>
            <li>Maximum file size: 1 MB</li>
          </ul>
        </div>

        <label className="manage-accounts-field">
          <span>Organization Name</span>
          <input value={organizationName} onChange={(event) => setOrganizationName(event.target.value)} />
        </label>

        <div className="manage-accounts-section">
          <div className="manage-accounts-section-heading">
            <h2>Domains</h2>
            <p>Primary domain is saved to company website URL.</p>
          </div>
          <div className="manage-accounts-domains">
            {domains.map((domain, index) => <span className="manage-accounts-domain" key={domain}>{domain}{index === 0 && <em>PRIMARY</em>}<button type="button" onClick={() => setDomains((items) => items.filter((item) => item !== domain))} aria-label={`Remove ${domain}`}><X size={17} /></button></span>)}
          </div>
          <div className="manage-accounts-domain-entry">
            <input value={domainInput} onChange={(event) => setDomainInput(event.target.value)} placeholder="example.com" onKeyDown={(event) => event.key === "Enter" && addDomain()} />
            <button type="button" onClick={addDomain}>Add Domain</button>
          </div>
        </div>

        <div className="manage-accounts-section manage-accounts-gst">
          <div className="manage-accounts-section-heading"><h2>GST Details</h2></div>
          <button type="button" className="manage-accounts-outline-button" onClick={() => setGstRecords((records) => [...records, `GST record ${records.length + 1}`])}><Plus size={24} /> Add GST</button>
          {gstRecords.length ? <ul className="manage-accounts-gst-list">{gstRecords.map((record) => <li key={record}>{record}</li>)}</ul> : <p>No GST records yet. Connect the backend GST API to save them here.</p>}
        </div>

        <button type="button" className="manage-accounts-save" onClick={() => { setSaved(true); window.setTimeout(() => setSaved(false), 1800); }}>{saved ? "Saved" : "Save Changes"}</button>
      </div>
    </section>
  );
}
