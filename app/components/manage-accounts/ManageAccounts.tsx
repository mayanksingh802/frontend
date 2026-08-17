"use client";

import {
  Check,
  ChevronDown,
  Download,
  Eye,
  ImagePlus,
  PencilLine,
  Plus,
  X,
} from "lucide-react";
import Image from "next/image";
import { ChangeEvent, useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { useSearchParams } from "next/navigation";
import { organizationSetupSectionMap } from "@/app/config/organization-setup";
import { useAuth } from "@/app/context/AuthContext";
import type { ManagementColumn } from "@/app/components/system-settings/ManagementTable";
import ManagementScreen from "@/app/components/system-settings/ManagementScreen";
import FilterHeaderRow from "@/app/components/ui/FilterHeaderRow";
import FormModal from "@/app/components/ui/FormModal";

type PolicyRow = {
  id: string;
  category: string;
  name: string;
  version: string;
  startDate: string;
  endDate: string;
  status: "Active" | "Draft" | "Expired";
};

type CompanyRow = {
  id: string;
  companyName: string;
  companyCode: string;
  domain: string;
  gstNumber: string;
  status: "Active" | "Pending" | "Inactive";
};

const COMPANY_API_BASE_URL =
  process.env.NEXT_PUBLIC_BACKEND_API_BASE_URL ?? "http://192.168.1.121:5555";

function normalizePolicyRow(item: Record<string, unknown>): PolicyRow {
  const category =
    String(item.category ?? item.policyCategory ?? item.type ?? "General");
  const name = String(
    item.name ?? item.policyName ?? item.title ?? item.policyTitle ?? "Untitled Policy",
  );
  const version = String(item.version ?? item.policyVersion ?? "V1.0");
  const startDate = String(
    item.startDate ?? item.start_date ?? item.effectiveStartDate ?? "N/A",
  );
  const endDate = String(
    item.endDate ?? item.end_date ?? item.effectiveEndDate ?? "N/A",
  );
  const statusValue = String(item.status ?? "Draft");

  const normalizedStatus =
    statusValue === "Active" || statusValue === "Draft" || statusValue === "Expired"
      ? statusValue
      : "Draft";

  return {
    id: String(item.id ?? `${name}-${version}-${startDate}`),
    category,
    name,
    version,
    startDate,
    endDate,
    status: normalizedStatus as PolicyRow["status"],
  };
}

function normalizeCompanyRow(item: Record<string, unknown>): CompanyRow {
  const companyName = String(
    item.companyName ?? item.company_name ?? item.name ?? item.company ?? "Unknown Company",
  );
  const companyCode = String(
    item.companyCode ?? item.company_code ?? item.code ?? item.companyCodeValue ?? "",
  );
  const domain = String(
    item.domain ?? item.companyDomain ?? item.emailDomain ?? item.website ?? "",
  );
  const gstNumber = String(
    item.gstNumber ?? item.gst_number ?? item.gst ?? item.gstNo ?? "",
  );
  const statusValue = String(item.status ?? "Active");

  return {
    id: String(item.id ?? item.companyId ?? item.company_id ?? (companyCode || companyName)),
    companyName,
    companyCode,
    domain,
    gstNumber,
    status:
      statusValue === "Active" || statusValue === "Pending" || statusValue === "Inactive"
        ? (statusValue as CompanyRow["status"])
        : "Active",
  };
}

export default function ManageAccounts() {
  const searchParams = useSearchParams();
  const activeSection = searchParams.get("section") ?? "organization-setup";
  const { user, hasAnyRole } = useAuth();
  const inputRef = useRef<HTMLInputElement>(null);
  const [logo, setLogo] = useState<string | null>(null);
  const [organizationName, setOrganizationName] = useState("CORPIZ");
  const [domainInput, setDomainInput] = useState("");
  const [domains, setDomains] = useState(["corpiz.com"]);
  const [gstRecords, setGstRecords] = useState<string[]>([]);
  const [saved, setSaved] = useState(false);
  const isSystemUser = hasAnyRole(["SYSTEM"]);
  const orgCode = user?.companyCode ?? "CORPIZ";
  const employeeId = user?.id ?? "";
  const [companyRows, setCompanyRows] = useState<CompanyRow[]>([]);
  const [companyLoading, setCompanyLoading] = useState(false);
  const [organizationSelectedCompany, setOrganizationSelectedCompany] = useState("all");
  const [policySelectedCompany, setPolicySelectedCompany] = useState("all");
  const [policyRows, setPolicyRows] = useState<PolicyRow[]>([]);
  const [policyLoading, setPolicyLoading] = useState(false);
  const [policyError, setPolicyError] = useState<string | null>(null);
  const [selectedPolicyCategory, setSelectedPolicyCategory] = useState("all");
  const [policyCategorySearch, setPolicyCategorySearch] = useState("");
  const [isPolicyCategoryOpen, setIsPolicyCategoryOpen] = useState(false);
  const [isAddPolicyModalOpen, setIsAddPolicyModalOpen] = useState(false);
  const [isSavingPolicy, setIsSavingPolicy] = useState(false);
  const [policySaveError, setPolicySaveError] = useState<string | null>(null);

  const loadCompanies = async () => {
    setCompanyLoading(true);

    try {
      const response = await fetch("/api/company/all", {
        headers: {
          Accept: "application/json",
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error("Unable to fetch company records.");
      }

      const payload = (await response.json()) as Record<string, unknown>;
      console.log("[company fetch] payload:", payload);
      const dataArray = Array.isArray(payload)
        ? payload
        : Array.isArray(payload.data)
          ? payload.data
          : Array.isArray(payload.result)
            ? payload.result
            : Array.isArray(payload.records)
              ? payload.records
              : [];

      const nextRows = dataArray.length
        ? dataArray.map((item) => normalizeCompanyRow(item as Record<string, unknown>))
        : [];

      setCompanyRows(nextRows);
    } catch {
      setCompanyRows([]);
    } finally {
      setCompanyLoading(false);
    }
  };

  const resolvePolicyCompanyCode = (value = policySelectedCompany) => {
    if (isSystemUser && value !== "all") {
      return (
        companyRows.find(
          (company) =>
            company.id === value ||
            company.companyCode === value ||
            company.companyName === value,
        )?.companyCode ?? value
      );
    }

    return orgCode;
  };

  const loadPolicies = async () => {
    setPolicyLoading(true);
    setPolicyError(null);

    try {
      const selectedCompanyCode = resolvePolicyCompanyCode();

      if (!selectedCompanyCode || selectedCompanyCode === "all") {
        setPolicyRows([]);
        return;
      }

      const response = await fetch(
        `/api/company-policy/company/${encodeURIComponent(selectedCompanyCode)}`,
        {
          headers: {
            Accept: "application/json",
          },
        },
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || "Unable to fetch policy records.");
      }

      const payload = (await response.json()) as {
        data?: Record<string, unknown>[];
        records?: Record<string, unknown>[];
        policies?: Record<string, unknown>[];
        result?: Record<string, unknown>[];
      };

      const dataArray = Array.isArray(payload)
        ? payload
        : Array.isArray(payload.data)
          ? payload.data
          : Array.isArray(payload.records)
            ? payload.records
            : Array.isArray(payload.policies)
              ? payload.policies
              : Array.isArray(payload.result)
                ? payload.result
                : [];

      const nextRows = dataArray.map((item) => normalizePolicyRow(item as Record<string, unknown>));

      setPolicyRows(nextRows);
      setPolicyError(null);
    } catch (error) {
      setPolicyRows([]);
      setPolicyError(
        error instanceof Error ? error.message : "Unable to fetch policy records.",
      );
    } finally {
      setPolicyLoading(false);
    }
  };

  const handleAddPolicy = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    const policyName = String(formData.get("policyName") ?? "").trim();
    const startDate = String(formData.get("startDate") ?? "").trim();
    const endDate = String(formData.get("endDate") ?? "").trim();
    const uploadedFile = formData.get("policyFile");

    const selectedCompanyCode = resolvePolicyCompanyCode();

    if (!selectedCompanyCode || selectedCompanyCode === "all") {
      setPolicySaveError("Please select a company before adding a policy.");
      return;
    }

    if (!policyName) {
      setPolicySaveError("Policy name is required.");
      return;
    }

    if (!startDate) {
      setPolicySaveError("Start date is required.");
      return;
    }

    if (uploadedFile instanceof File && uploadedFile.size > 0) {
      if (uploadedFile.type && !uploadedFile.type.toLowerCase().includes("pdf")) {
        setPolicySaveError("Only PDF files are allowed.");
        return;
      }
    }

    try {
      setIsSavingPolicy(true);
      setPolicySaveError(null);

      const payload = {
        companyCode: selectedCompanyCode,
        name: policyName,
        startDate,
        ...(endDate ? { endDate } : {}),
      };

      const hasFile = uploadedFile instanceof File && uploadedFile.size > 0;
      const body = new FormData();

      body.append("policy", JSON.stringify(payload));

      if (hasFile) {
        body.append("file", uploadedFile, uploadedFile.name);
      }

      const response = await fetch("/api/company-policy/add", {
        method: "POST",
        body,
      });

      const result = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(result?.message ?? "Unable to add policy.");
      }

      setIsAddPolicyModalOpen(false);
      event.currentTarget.reset();
      await loadPolicies();
    } catch (error) {
      setPolicySaveError(
        error instanceof Error ? error.message : "Unable to add policy.",
      );
    } finally {
      setIsSavingPolicy(false);
    }
  };

  useEffect(() => {
    if (activeSection !== "organization" && activeSection !== "organization-policy") {
      return;
    }

    void loadCompanies();
  }, [activeSection]);

  useEffect(() => {
    if (activeSection !== "organization-policy") {
      return;
    }

    void loadPolicies();
  }, [activeSection, orgCode, policySelectedCompany, employeeId, isSystemUser, companyRows]);

  function uploadLogo(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (file) setLogo(URL.createObjectURL(file));
  }

  function addDomain() {
    const domain = domainInput.trim().replace(/^https?:\/\//, "");
    if (domain && !domains.includes(domain))
      setDomains((current) => [...current, domain]);
    setDomainInput("");
  }

  const sectionContent =
    organizationSetupSectionMap[activeSection] ??
    organizationSetupSectionMap["organization-policy"];

  const companyOptions = useMemo(
    () => [
      { value: "all", label: "Select Company" },
      ...companyRows.map((company) => ({
        value: company.companyCode || company.id,
        label: company.companyName || company.companyCode || "Unknown company",
      })),
    ],
    [companyRows],
  );

  const filteredCompanyRows = useMemo(() => {
    if (organizationSelectedCompany === "all") {
      return companyRows;
    }

    return companyRows.filter(
      (company) =>
        company.id === organizationSelectedCompany ||
        company.companyCode === organizationSelectedCompany ||
        company.companyName === organizationSelectedCompany,
    );
  }, [companyRows, organizationSelectedCompany]);

  const filteredPolicies = useMemo(() => {
    return policyRows;
  }, [policyRows]);

  const companyColumns = useMemo<ManagementColumn<CompanyRow>[]>(
    () => [
      {
        id: "companyName",
        label: "Company Name",
        render: (company) => company.companyName,
        exportValue: (company) => company.companyName,
      },
      {
        id: "companyCode",
        label: "Company Code",
        render: (company) => company.companyCode,
        exportValue: (company) => company.companyCode,
      },
      {
        id: "domain",
        label: "Domain",
        render: (company) => company.domain,
        exportValue: (company) => company.domain,
      },
      {
        id: "gstNumber",
        label: "GST Number",
        render: (company) => company.gstNumber,
        exportValue: (company) => company.gstNumber,
      },
      {
        id: "status",
        label: "Status",
        render: (company) => (
          <span
            className={`manage-accounts-status manage-accounts-status-${company.status.toLowerCase()}`}
          >
            {company.status}
          </span>
        ),
        exportValue: (company) => company.status,
      },
      {
        id: "action",
        label: "Action",
        render: (company) => (
          <div className="manage-accounts-policy-actions">
            <button
              type="button"
              className="manage-accounts-policy-action-btn"
              title="View"
              aria-label={`View ${company.companyName}`}
              onClick={() => console.log("View company", company.id)}
            >
              <Eye size={16} />
            </button>
            <button
              type="button"
              className="manage-accounts-policy-action-btn"
              title="Edit"
              aria-label={`Edit ${company.companyName}`}
              onClick={() => console.log("Edit company", company.id)}
            >
              <PencilLine size={16} />
            </button>
          </div>
        ),
        exportValue: (company) => company.status,
      },
    ],
    [],
  );

  const policyColumns = useMemo<ManagementColumn<PolicyRow>[]>(
    () => [
      { id: "name", label: "Name", render: (policy) => policy.name, exportValue: (policy) => policy.name },
      { id: "version", label: "Version", render: (policy) => policy.version, exportValue: (policy) => policy.version },
      {
        id: "startDate",
        label: "Start Date",
        render: (policy) => policy.startDate,
        exportValue: (policy) => policy.startDate,
      },
      {
        id: "endDate",
        label: "End Date",
        render: (policy) => policy.endDate,
        exportValue: (policy) => policy.endDate,
      },
      {
        id: "status",
        label: "Status",
        render: (policy) => (
          <span
            className={`manage-accounts-status manage-accounts-status-${policy.status.toLowerCase()}`}
          >
            {policy.status}
          </span>
        ),
        exportValue: (policy) => policy.status,
      },
      {
        id: "action",
        label: "Action",
        render: (policy) => (
          <div className="manage-accounts-policy-actions">
            <button
              type="button"
              className="manage-accounts-policy-action-btn"
              title="View"
              aria-label={`View ${policy.name}`}
              onClick={() => console.log("View policy", policy.id)}
            >
              <Eye size={16} />
            </button>
            <button
              type="button"
              className="manage-accounts-policy-action-btn"
              title="Download"
              aria-label={`Download ${policy.name}`}
              onClick={() => console.log("Download policy", policy.id)}
            >
              <Download size={16} />
            </button>
            <button
              type="button"
              className="manage-accounts-policy-action-btn"
              title="Update"
              aria-label={`Update ${policy.name}`}
              onClick={() => console.log("Update policy", policy.id)}
            >
              <PencilLine size={16} />
            </button>
          </div>
        ),
        exportValue: (policy) => policy.status,
      },
    ],
    [],
  );

  if (activeSection === "organization") {
    return (
      <section className="manage-accounts-page">
        <div className="manage-accounts-card">
          <div className="manage-accounts-policy-header-row">
            <div className="manage-accounts-policy-title-block">
              <h1 className="manage-accounts-policy-title">Organization</h1>
            </div>
          </div>

          <div className="manage-accounts-policy-toolbar" style={{ marginBottom: 16 }}>
            <FilterHeaderRow
              title=""
              value={organizationSelectedCompany}
              options={companyOptions}
              onChange={setOrganizationSelectedCompany}
              searchPlaceholder="Search company or org"
              emptyMessage="No company/org found."
            />
          </div>

          <ManagementScreen
            title="Company Details"
            entityName="Company"
            items={filteredCompanyRows}
            columns={companyColumns}
            loading={companyLoading}
            error={null}
            showHeader={false}
            showSearch={true}
            onRefresh={() => {
              if (activeSection === "organization") {
                const loadCompanies = async () => {
                  setCompanyLoading(true);

                  try {
                    const response = await fetch("/api/company/all", {
                      headers: {
                        Accept: "application/json",
                      },
                    });

                    if (!response.ok) {
                      throw new Error("Unable to fetch company records.");
                    }

                    const payload = (await response.json()) as Record<string, unknown>;
                    const dataArray = Array.isArray(payload)
                      ? payload
                      : Array.isArray(payload.data)
                        ? payload.data
                        : Array.isArray(payload.result)
                          ? payload.result
                          : Array.isArray(payload.records)
                            ? payload.records
                            : [];

                    const nextRows = dataArray.length
                      ? dataArray.map((item) => normalizeCompanyRow(item as Record<string, unknown>))
                      : [];

                    setCompanyRows(nextRows);
                  } catch {
                    setCompanyRows([]);
                  } finally {
                    setCompanyLoading(false);
                  }
                };

                void loadCompanies();
              }
            }}
            onAdd={() => console.log("Add company clicked")}
            getRowId={(company) => company.id}
            getRowLabel={(company) => company.companyName}
            getSearchValues={(company) => [
              company.companyName,
              company.companyCode,
              company.domain,
              company.gstNumber,
              company.status,
            ]}
            emptyMessage="No company records available."
            showActions={true}
          />
        </div>
      </section>
    );
  }

  if (activeSection === "organization-policy") {
    return (
      <>
        <section className="manage-accounts-page">
          <div className="manage-accounts-card">
            <div className="manage-accounts-policy-header-row">
              <div className="manage-accounts-policy-title-block">
                <h1 className="manage-accounts-policy-title">Company Policy</h1>
              </div>

              {isSystemUser && (
                <div className="manage-accounts-policy-toolbar">
                  <FilterHeaderRow
                    title=""
                    value={policySelectedCompany}
                    options={companyOptions}
                    onChange={setPolicySelectedCompany}
                    searchPlaceholder="Search company or org"
                    emptyMessage="No company/org found."
                  />
                </div>
              )}
            </div>

            {isSystemUser && policySelectedCompany === "all" ? (
              <div className="manage-accounts-empty-state">Please select a company to view policy records.</div>
            ) : (
              <ManagementScreen
                title="Company Policy"
                entityName="Policy"
                items={filteredPolicies}
                columns={policyColumns}
                loading={policyLoading}
                error={policyError}
                showHeader={false}
                showSearch={true}
                onRefresh={() => {
                  if (activeSection === "organization-policy") {
                    void loadPolicies();
                  }
                }}
                onAdd={isSystemUser ? () => setIsAddPolicyModalOpen(true) : undefined}
                getRowId={(policy) => policy.id}
                getRowLabel={(policy) => policy.name}
                getSearchValues={(policy) => [
                  policy.name,
                  policy.category,
                  policy.version,
                  policy.startDate,
                  policy.endDate,
                  policy.status,
                ]}
                emptyMessage="No policy records available."
                showActions={true}
              />
            )}
          </div>
        </section>

        <FormModal
          title="Add Policy"
          isOpen={isAddPolicyModalOpen}
          onClose={() => {
            if (!isSavingPolicy) {
              setPolicySaveError(null);
              setIsAddPolicyModalOpen(false);
            }
          }}
          onSubmit={handleAddPolicy}
          saveLabel="Save Policy"
          saving={isSavingPolicy}
        >
          {policySaveError && <p className="app-form-error">{policySaveError}</p>}

          <label className="app-form-field">
            <span>Policy Name</span>
            <input name="policyName" required />
          </label>

          <label className="app-form-field">
            <span>Start Date</span>
            <input type="date" name="startDate" required />
          </label>

          <label className="app-form-field">
            <span>End Date</span>
            <input type="date" name="endDate" />
          </label>

          <label className="app-form-field">
            <span>Policy File (PDF)</span>
            <input type="file" name="policyFile" accept="application/pdf" />
          </label>
        </FormModal>
      </>
    );
  }

  if (activeSection !== "organization-setup") {
    return (
      <section className="manage-accounts-page">
        <div className="manage-accounts-card manage-accounts-placeholder-card">
          <p className="manage-accounts-eyebrow">MANAGE ACCOUNTS</p>
          <h1>{sectionContent.label}</h1>
          <p>{sectionContent.description}</p>
          <button type="button" className="manage-accounts-save">
            Configure {sectionContent.label}
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="manage-accounts-page">
      <div className="manage-accounts-card">
        <div className="manage-accounts-card-header">
          <div>
            <h1>Company Profile</h1>
            <p>
              Company Code: <strong>CORPIZ</strong>
            </p>
          </div>
          <div className="manage-accounts-code">CORPIZ</div>
        </div>

        <div className="manage-accounts-logo-row">
          <button
            type="button"
            className="manage-accounts-logo-upload"
            onClick={() => inputRef.current?.click()}
          >
            {logo ? (
              <Image src={logo} alt="Organization logo" fill unoptimized />
            ) : (
              <>
                <ImagePlus size={45} />
                <span>Upload Logo</span>
              </>
            )}
          </button>
          <input
            ref={inputRef}
            className="manage-accounts-file-input"
            type="file"
            accept="image/png,image/jpeg,image/gif,image/bmp"
            onChange={uploadLogo}
          />
          <ul>
            <li>Preferred image dimensions: 240 × 240 pixels @ 72 DPI</li>
            <li>Supported formats: JPG, JPEG, PNG, GIF, BMP</li>
            <li>Maximum file size: 1 MB</li>
          </ul>
        </div>

        <label className="manage-accounts-field">
          <span>Organization Name</span>
          <input
            value={organizationName}
            onChange={(event) => setOrganizationName(event.target.value)}
          />
        </label>

        <div className="manage-accounts-section">
          <div className="manage-accounts-section-heading">
            <h2>Domains</h2>
            <p>Primary domain is saved to company website URL.</p>
          </div>
          <div className="manage-accounts-domains">
            {domains.map((domain, index) => (
              <span className="manage-accounts-domain" key={domain}>
                {domain}
                {index === 0 && <em>PRIMARY</em>}
                <button
                  type="button"
                  onClick={() =>
                    setDomains((items) =>
                      items.filter((item) => item !== domain),
                    )
                  }
                  aria-label={`Remove ${domain}`}
                >
                  <X size={17} />
                </button>
              </span>
            ))}
          </div>
          <div className="manage-accounts-domain-entry">
            <input
              value={domainInput}
              onChange={(event) => setDomainInput(event.target.value)}
              placeholder="example.com"
              onKeyDown={(event) => event.key === "Enter" && addDomain()}
            />
            <button type="button" onClick={addDomain}>
              Add Domain
            </button>
          </div>
        </div>

        <div className="manage-accounts-section manage-accounts-gst">
          <div className="manage-accounts-section-heading">
            <h2>GST Details</h2>
          </div>
          <button
            type="button"
            className="manage-accounts-outline-button"
            onClick={() =>
              setGstRecords((records) => [
                ...records,
                `GST record ${records.length + 1}`,
              ])
            }
          >
            <Plus size={24} /> Add GST
          </button>
          {gstRecords.length ? (
            <ul className="manage-accounts-gst-list">
              {gstRecords.map((record) => (
                <li key={record}>{record}</li>
              ))}
            </ul>
          ) : (
            <p>
              No GST records yet. Connect the backend GST API to save them here.
            </p>
          )}
        </div>

        <button
          type="button"
          className="manage-accounts-save"
          onClick={() => {
            setSaved(true);
            window.setTimeout(() => setSaved(false), 1800);
          }}
        >
          {saved ? "Saved" : "Save Changes"}
        </button>
      </div>
    </section>
  );
}
