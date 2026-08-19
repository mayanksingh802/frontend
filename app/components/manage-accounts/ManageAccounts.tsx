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
import {
  ChangeEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
} from "react";
import { useSearchParams } from "next/navigation";
import { organizationSetupSectionMap } from "@/app/config/organization-setup";
import { useAuth } from "@/app/context/AuthContext";
import type { ManagementColumn } from "@/app/components/system-settings/ManagementTable";
import ManagementScreen from "@/app/components/system-settings/ManagementScreen";
import FilterHeaderRow from "@/app/components/ui/FilterHeaderRow";
import FormModal from "@/app/components/ui/FormModal";
import Modal from "@/app/components/ui/Modal";
import DepartmentManagement from "@/app/components/manage-accounts/DepartmentManagement";
import OrganizationStructureManagement from "@/app/components/manage-accounts/OrganizationStructureManagement";

type PolicyRow = {
  id: string;
  companyCode: string;
  category: string;
  name: string;
  version: string;
  startDate: string;
  endDate: string;
  status: string;
  remark: string;
  fileName: string;
  updatedOn: string;
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
  const category = String(
    item.category ?? item.policyCategory ?? item.type ?? "General",
  );
  const name = String(
    item.name ??
      item.policyName ??
      item.title ??
      item.policyTitle ??
      "Untitled Policy",
  );
  const version = String(item.version ?? item.policyVersion ?? "V1.0");
  const startDate = String(
    item.startDate ?? item.start_date ?? item.effectiveStartDate ?? "N/A",
  );
  const endDate = String(
    item.endDate ?? item.end_date ?? item.effectiveEndDate ?? "N/A",
  );
  const statusValue = String(item.status ?? "DRAFT");

  return {
    id: String(item.id ?? `${name}-${version}-${startDate}`),
    companyCode: String(item.companyCode ?? item.company_code ?? ""),
    category,
    name,
    version,
    startDate,
    endDate,
    status: statusValue,
    remark: String(item.remark ?? ""),
    fileName: String(item.fileName ?? item.file_name ?? ""),
    updatedOn: String(item.updatedOn ?? item.updated_at ?? ""),
  };
}

function normalizeCompanyRow(item: Record<string, unknown>): CompanyRow {
  const companyName = String(
    item.companyName ??
      item.company_name ??
      item.name ??
      item.company ??
      "Unknown Company",
  );
  const companyCode = String(
    item.companyCode ??
      item.company_code ??
      item.code ??
      item.companyCodeValue ??
      "",
  );
  const domain = String(
    item.domain ?? item.companyDomain ?? item.emailDomain ?? item.website ?? "",
  );
  const gstNumber = String(
    item.gstNumber ?? item.gst_number ?? item.gst ?? item.gstNo ?? "",
  );
  const statusValue = String(item.status ?? "Active");

  return {
    id: String(
      item.id ??
        item.companyId ??
        item.company_id ??
        (companyCode || companyName),
    ),
    companyName,
    companyCode,
    domain,
    gstNumber,
    status:
      statusValue === "Active" ||
      statusValue === "Pending" ||
      statusValue === "Inactive"
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
  const [profileCompanyCode, setProfileCompanyCode] = useState<string | null>(
    orgCode,
  );
  const [companyDetails, setCompanyDetails] = useState<Record<
    string,
    any
  > | null>(null);
  const [companyRows, setCompanyRows] = useState<CompanyRow[]>([]);
  const [companyLoading, setCompanyLoading] = useState(false);
  const [organizationSelectedCompany, setOrganizationSelectedCompany] =
    useState("all");
  const [policySelectedCompany, setPolicySelectedCompany] = useState("all");
  const [policyRows, setPolicyRows] = useState<PolicyRow[]>([]);
  const [policyLoading, setPolicyLoading] = useState(false);
  const [policyError, setPolicyError] = useState<string | null>(null);
  // const [selectedPolicyCategory, setSelectedPolicyCategory] = useState("all");
  // const [policyCategorySearch, setPolicyCategorySearch] = useState("");
  // const [isPolicyCategoryOpen, setIsPolicyCategoryOpen] = useState(false);
  const [isAddPolicyModalOpen, setIsAddPolicyModalOpen] = useState(false);
  const [isSavingPolicy, setIsSavingPolicy] = useState(false);
  const [policySaveError, setPolicySaveError] = useState<string | null>(null);
  const [policyToEdit, setPolicyToEdit] = useState<PolicyRow | null>(null);
  const [isLoadingPolicyToEdit, setIsLoadingPolicyToEdit] = useState(false);
  const [policyToDelete, setPolicyToDelete] = useState<PolicyRow | null>(null);
  const [isDeletingPolicy, setIsDeletingPolicy] = useState(false);
  const [policyDeleteError, setPolicyDeleteError] = useState<string | null>(
    null,
  );
  const [isSavingCompany, setIsSavingCompany] = useState(false);
  const [isAddCompanyModalOpen, setIsAddCompanyModalOpen] = useState(false);
  const [addCompanyError, setAddCompanyError] = useState<string | null>(null);
  const [showDepartments, setShowDepartments] = useState(false);
  const [companyToDelete, setCompanyToDelete] = useState<CompanyRow | null>(
    null,
  );
  const [companyToEdit, setCompanyToEdit] = useState<CompanyRow | null>(null);
  const [companyToView, setCompanyToView] = useState<CompanyRow | null>(null);
  const [isDeletingCompany, setIsDeletingCompany] = useState(false);
  const [deleteCompanyError, setDeleteCompanyError] = useState<string | null>(
    null,
  );
  const [isSavingCompanyEdit, setIsSavingCompanyEdit] = useState(false);
  const [editCompanyError, setEditCompanyError] = useState<string | null>(null);
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
        ? dataArray.map((item) =>
            normalizeCompanyRow(item as Record<string, unknown>),
          )
        : [];

      setCompanyRows(nextRows);
    } catch {
      setCompanyRows([]);
    } finally {
      setCompanyLoading(false);
    }
  };

  const loadCompanyProfile = async (code: string | null) => {
    if (!code) return;

    try {
      // use configured backend base URL if available, otherwise fall back to same-origin
      // call the local Next.js API proxy so requests go through server-side and include auth
      const resp = await fetch(
        `/api/company/code/${encodeURIComponent(code)}`,
        {
          headers: { Accept: "application/json" },
        },
      );
      if (!resp.ok) {
        console.warn("Company profile fetch failed", resp.status);
        setCompanyDetails(null);
        return;
      }

      const payload = await resp.json().catch(() => null);
      if (!payload) {
        setCompanyDetails(null);
        return;
      }

      setCompanyDetails(payload);

      // populate fields
      if (payload.name) setOrganizationName(String(payload.name));
      if (payload.code) setOrganizationSelectedCompany(String(payload.code));
      // set logo if available (use thumb or full path)
      const logoPath =
        payload.thumbLogoFilePath ?? payload.logoFilePath ?? null;
      if (logoPath) setLogo(String(logoPath));
    } catch (err) {
      console.error("Error loading company profile", err);
      setCompanyDetails(null);
    }
  };

  const handleDeleteCompany = async () => {
    if (!companyToDelete) return;

    try {
      setIsDeletingCompany(true);
      setDeleteCompanyError(null);

      const response = await fetch(
        `/api/company/${encodeURIComponent(companyToDelete.id)}`,
        { method: "DELETE" },
      );

      if (!response.ok) {
        const errorText = await response.text().catch(() => "");
        throw new Error(errorText || "Unable to delete company.");
      }

      setCompanyRows((rows) =>
        rows.filter((row) => row.id !== companyToDelete.id),
      );
      setCompanyToDelete(null);
    } catch (error) {
      setDeleteCompanyError(
        error instanceof Error ? error.message : "Unable to delete company.",
      );
    } finally {
      setIsDeletingCompany(false);
    }
  };

  const handleUpdateCompany = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!companyToEdit) return;

    const formData = new FormData(event.currentTarget);
    const name = String(formData.get("name") ?? "").trim();
    const domain = String(formData.get("domain") ?? "").trim();
    const gstNumber = String(formData.get("gstNumber") ?? "").trim();
    const status = String(formData.get("status") ?? "Active");
    const code = companyToEdit.companyCode;

    if (!code || !name) {
      setEditCompanyError("Company name is required.");
      return;
    }

    try {
      setIsSavingCompanyEdit(true);
      setEditCompanyError(null);

      const response = await fetch(
        `/api/company/${encodeURIComponent(companyToEdit.id)}`,
        {
          method: "PUT",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ code, name, domain, gstNumber, status }),
        },
      );

      if (!response.ok) {
        const errorText = await response.text().catch(() => "");
        throw new Error(errorText || "Unable to update company.");
      }

      setCompanyRows((rows) =>
        rows.map((row) =>
          row.id === companyToEdit.id
            ? {
                ...row,
                companyCode: code,
                companyName: name,
                domain,
                gstNumber,
                status: status as CompanyRow["status"],
              }
            : row,
        ),
      );
      setCompanyToEdit(null);
    } catch (error) {
      setEditCompanyError(
        error instanceof Error ? error.message : "Unable to update company.",
      );
    } finally {
      setIsSavingCompanyEdit(false);
    }
  };

  useEffect(() => {
    // load company profile when profileCompanyCode changes
    void loadCompanyProfile(profileCompanyCode);
  }, [profileCompanyCode]);

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

      const nextRows = dataArray.map((item) =>
        normalizePolicyRow(item as Record<string, unknown>),
      );

      setPolicyRows(nextRows);
      setPolicyError(null);
    } catch (error) {
      setPolicyRows([]);
      setPolicyError(
        error instanceof Error
          ? error.message
          : "Unable to fetch policy records.",
      );
    } finally {
      setPolicyLoading(false);
    }
  };

  const handleAddPolicy = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formElement = event.currentTarget;
    const formData = new FormData(formElement);

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
      if (
        uploadedFile.type &&
        !uploadedFile.type.toLowerCase().includes("pdf")
      ) {
        setPolicySaveError("Only PDF files are allowed.");
        return;
      }
    }

    try {
      setIsSavingPolicy(true);
      setPolicySaveError(null);

      const payload = {
        companyCode: selectedCompanyCode,
        // include both keys to be resilient to backend expectations
        policyName: policyName,
        name: policyName,
        startDate,
        ...(endDate ? { endDate } : {}),
      };

      const body = new FormData();
      body.append("request", JSON.stringify(payload));

      if (uploadedFile instanceof File && uploadedFile.size > 0) {
        body.append("file", uploadedFile, uploadedFile.name);
      }

      const response = await fetch("/api/company-policy/add", {
        method: "POST",
        body,
      });

      let result: any = null;
      try {
        result = await response.json();
      } catch {
        result = null;
      }

      if (!response.ok) {
        // Derive a helpful error message from common backend shapes
        let errMsg = "Unable to add policy.";

        if (result) {
          if (typeof result.message === "string") errMsg = result.message;
          else if (Array.isArray(result.message))
            errMsg = result.message.join("; ");
          else if (typeof result.error === "string") errMsg = result.error;
          else if (Array.isArray(result.errors))
            errMsg = result.errors
              .map((e: any) => e.message || String(e))
              .join("; ");
          else if (result.detail) errMsg = String(result.detail);
        } else if (response.statusText) {
          errMsg = response.statusText;
        }

        setPolicySaveError(errMsg);
        return;
      }

      setIsAddPolicyModalOpen(false);
      formElement.reset();
      await loadPolicies();
    } catch (error) {
      setPolicySaveError(
        error instanceof Error ? error.message : "Unable to add policy.",
      );
    } finally {
      setIsSavingPolicy(false);
    }
  };

  const openPolicyUpdate = async (policy: PolicyRow) => {
    setPolicySaveError(null);
    setPolicyToEdit(policy);
    setIsLoadingPolicyToEdit(true);

    try {
      const response = await fetch(
        `/api/company-policy/${encodeURIComponent(policy.id)}`,
        { headers: { Accept: "application/json" } },
      );
      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(payload?.message ?? "Unable to fetch policy details.");
      }

      const policyDetails =
        payload?.data ?? payload?.result ?? payload;
      setPolicyToEdit(normalizePolicyRow(policyDetails as Record<string, unknown>));
    } catch (error) {
      setPolicySaveError(
        error instanceof Error ? error.message : "Unable to fetch policy details.",
      );
    } finally {
      setIsLoadingPolicyToEdit(false);
    }
  };

  const handleUpdatePolicy = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!policyToEdit || isSavingPolicy) return;

    const formData = new FormData(event.currentTarget);
    const companyCode = String(formData.get("companyCode") ?? "").trim();
    const name = String(formData.get("policyName") ?? "").trim();
    const startDate = String(formData.get("startDate") ?? "").trim();
    const endDate = String(formData.get("endDate") ?? "").trim();
    const status = String(formData.get("status") ?? "").trim();
    const remark = String(formData.get("remark") ?? "").trim();
    const uploadedFile = formData.get("policyFile");

    if (!companyCode || !name || !startDate || !status) {
      setPolicySaveError("Company code, policy name, start date and status are required.");
      return;
    }

    if (
      uploadedFile instanceof File &&
      uploadedFile.size > 0 &&
      uploadedFile.type &&
      !uploadedFile.type.toLowerCase().includes("pdf")
    ) {
      setPolicySaveError("Only PDF files are allowed.");
      return;
    }

    try {
      setIsSavingPolicy(true);
      setPolicySaveError(null);

      const body = new FormData();
      body.append(
        "request",
        JSON.stringify({
          companyCode,
          name,
          startDate,
          endDate: endDate || null,
          status,
          remark: remark || null,
        }),
      );
      if (uploadedFile instanceof File && uploadedFile.size > 0) {
        body.append("file", uploadedFile, uploadedFile.name);
      }

      const response = await fetch(
        `/api/company-policy/${encodeURIComponent(policyToEdit.id)}`,
        { method: "PUT", body },
      );
      const result = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(result?.message ?? "Unable to update policy.");
      }

      setPolicyToEdit(null);
      await loadPolicies();
    } catch (error) {
      setPolicySaveError(
        error instanceof Error ? error.message : "Unable to update policy.",
      );
    } finally {
      setIsSavingPolicy(false);
    }
  };

  const handleDeletePolicy = async () => {
    if (!policyToDelete || isDeletingPolicy) {
      return;
    }

    try {
      setIsDeletingPolicy(true);
      setPolicyDeleteError(null);

      const response = await fetch(
        `/api/company-policy/${encodeURIComponent(policyToDelete.id)}`,
        {
          method: "DELETE",
          headers: { Accept: "application/json" },
        },
      );
      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(payload?.message ?? "Unable to delete policy.");
      }

      setPolicyToDelete(null);
      await loadPolicies();
    } catch (error) {
      setPolicyDeleteError(
        error instanceof Error ? error.message : "Unable to delete policy.",
      );
    } finally {
      setIsDeletingPolicy(false);
    }
  };

  useEffect(() => {
    if (
      activeSection !== "organization" &&
      activeSection !== "organization-policy" &&
      activeSection !== "organization-setup"
    ) {
      return;
    }

    void loadCompanies();
  }, [activeSection]);

  useEffect(() => {
    if (activeSection !== "organization-policy") {
      return;
    }

    void loadPolicies();
  }, [
    activeSection,
    orgCode,
    policySelectedCompany,
    employeeId,
    isSystemUser,
    companyRows,
  ]);

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

  // const filteredCompanyRows = useMemo(() => {
  //   if (organizationSelectedCompany === "all") {
  //     return companyRows;
  //   }

  //   return companyRows.filter(
  //     (company) =>
  //       company.id === organizationSelectedCompany ||
  //       company.companyCode === organizationSelectedCompany ||
  //       company.companyName === organizationSelectedCompany,
  //   );
  // }, [companyRows, organizationSelectedCompany]);

  const filteredPolicies = useMemo(() => {
    return policyRows;
  }, [policyRows]);

  const companyColumns = useMemo<ManagementColumn<CompanyRow>[]>(
    () => [
      {
        id: "serialNo",
        label: "S.No.",
        render: (_company, index) => (index ?? 0) + 1,
        exportValue: (_company, index) => (index ?? 0) + 1,
      },
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
    ],
    [],
  );

  const policyColumns = useMemo<ManagementColumn<PolicyRow>[]>(
    () => [
      {
        id: "serialNo",
        label: "S.No.",
        render: (_policy, index) => (index ?? 0) + 1,
        exportValue: (_policy, index) => (index ?? 0) + 1,
      },
      {
        id: "name",
        label: "Name",
        render: (policy) => policy.name,
        exportValue: (policy) => policy.name,
      },
      {
        id: "version",
        label: "Version",
        render: (policy) => policy.version,
        exportValue: (policy) => policy.version,
      },
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
      // {
      //   id: "action",
      //   label: "Action",
      //   render: (policy) => (
      //     <div className="manage-accounts-policy-actions">
      //       <button
      //         type="button"
      //         className="manage-accounts-policy-action-btn"
      //         title="View"
      //         aria-label={`View ${policy.name}`}
      //         onClick={() => console.log("View policy", policy.id)}
      //       >
      //         <Eye size={16} />
      //       </button>
      //       <button
      //         type="button"
      //         className="manage-accounts-policy-action-btn"
      //         title="Download"
      //         aria-label={`Download ${policy.name}`}
      //         onClick={() => console.log("Download policy", policy.id)}
      //       >
      //         <Download size={16} />
      //       </button>
      //       <button
      //         type="button"
      //         className="manage-accounts-policy-action-btn"
      //         title="Update"
      //         aria-label={`Update ${policy.name}`}
      //         onClick={() => console.log("Update policy", policy.id)}
      //       >
      //         <PencilLine size={16} />
      //       </button>
      //     </div>
      //   ),
      //   exportValue: (policy) => policy.status,
      // },
    ],
    [],
  );

  if (activeSection === "organization") {
    return (
      <section className="manage-accounts-page">
        <div className="manage-accounts-card">
          <div className="manage-accounts-policy-header-row">
            <div className="manage-accounts-policy-title-block">
              <h1 className="manage-accounts-policy-title">Company</h1>
            </div>
          </div>

          <div
            className="manage-accounts-policy-toolbar"
            style={{ marginBottom: 16 }}
          >
            <div style={{ marginLeft: 8 }}>
              <button
                type="button"
                className="manage-accounts-outline-button"
                onClick={() => setShowDepartments((s) => !s)}
              >
                Departments
              </button>
            </div>
          </div>

          <ManagementScreen
            title="Company Details"
            entityName="Company"
            // items={filteredCompanyRows}
            items={companyRows}
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

                    const payload = (await response.json()) as Record<
                      string,
                      unknown
                    >;
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
                      ? dataArray.map((item) =>
                          normalizeCompanyRow(item as Record<string, unknown>),
                        )
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
            onAdd={() => setIsAddCompanyModalOpen(true)}
            onView={(company) => setCompanyToView(company)}
            onEdit={(company) => setCompanyToEdit(company)}
            onDelete={(company) => setCompanyToDelete(company)}
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

          <FormModal
            title="Add Company"
            isOpen={isAddCompanyModalOpen}
            onClose={() => {
              if (!isSavingCompany) {
                setAddCompanyError(null);
                setIsAddCompanyModalOpen(false);
              }
            }}
            onSubmit={async (event) => {
              event.preventDefault();
              const form = event.currentTarget as HTMLFormElement;
              const formData = new FormData(form);

              const code = String(formData.get("code") ?? "").trim();
              const name = String(formData.get("name") ?? "").trim();
              const websiteUrl = String(
                formData.get("websiteUrl") ?? "",
              ).trim();
              const logoFile = formData.get("logoFile");

              if (!code) {
                setAddCompanyError("Company code is required.");
                return;
              }

              if (!name) {
                setAddCompanyError("Company name is required.");
                return;
              }

              try {
                setIsSavingCompany(true);
                setAddCompanyError(null);

                const payload = {
                  code,
                  name,
                  thumbLogoFileName: null,
                  thumbLogoFilePath: null,
                  logoFileName: null,
                  logoFilePath: null,
                  websiteUrl: websiteUrl || null,
                } as Record<string, any>;

                let resp: Response;

                if (logoFile instanceof File && logoFile.size > 0) {
                  const body = new FormData();
                  body.append("request", JSON.stringify(payload));
                  body.append("file", logoFile, logoFile.name);

                  resp = await fetch("/api/company/add", {
                    method: "POST",
                    body,
                  });
                } else {
                  resp = await fetch("/api/company/add", {
                    method: "POST",
                    headers: { "content-type": "application/json" },
                    body: JSON.stringify(payload),
                  });
                }

                let result: any = null;
                try {
                  result = await resp.json();
                } catch {
                  result = null;
                }

                if (!resp.ok) {
                  let msg = "Unable to add company.";
                  if (result) {
                    if (typeof result.message === "string")
                      msg = result.message;
                    else if (result.detail) msg = String(result.detail);
                  } else if (resp.statusText) {
                    msg = resp.statusText;
                  }

                  setAddCompanyError(msg);
                  return;
                }

                setIsAddCompanyModalOpen(false);
                form.reset();
                await loadCompanies();
              } catch (err) {
                setAddCompanyError(
                  err instanceof Error ? err.message : String(err),
                );
              } finally {
                setIsSavingCompany(false);
              }
            }}
            saveLabel="Save Company"
            saving={isSavingCompany}
          >
            {addCompanyError && (
              <p className="app-form-error">{addCompanyError}</p>
            )}

            <label className="app-form-field">
              <span>Company Code</span>
              <input name="code" required />
            </label>

            <label className="app-form-field">
              <span>Company Name</span>
              <input name="name" required />
            </label>

            <label className="app-form-field">
              <span>Website URL</span>
              <input name="websiteUrl" placeholder="https://example.com" />
            </label>

            <label className="app-form-field">
              <span>Logo (optional)</span>
              <input type="file" name="logoFile" accept="image/*" />
            </label>
          </FormModal>

          <Modal
            title="Delete Company"
            isOpen={Boolean(companyToDelete)}
            onClose={() => {
              if (!isDeletingCompany) {
                setDeleteCompanyError(null);
                setCompanyToDelete(null);
              }
            }}
            footer={
              <>
                <button
                  type="button"
                  className="app-modal-cancel"
                  onClick={() => {
                    setDeleteCompanyError(null);
                    setCompanyToDelete(null);
                  }}
                  disabled={isDeletingCompany}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="app-modal-save"
                  onClick={handleDeleteCompany}
                  disabled={isDeletingCompany}
                >
                  {isDeletingCompany ? "Deleting..." : "Delete"}
                </button>
              </>
            }
          >
            {deleteCompanyError && (
              <p className="app-form-error">{deleteCompanyError}</p>
            )}
            <p>
              Are you sure you want to delete{" "}
              <strong>{companyToDelete?.companyName}</strong> (
              {companyToDelete?.companyCode})? This action cannot be undone.
            </p>
          </Modal>

          <FormModal
            title="Update Company"
            isOpen={Boolean(companyToEdit)}
            onClose={() => {
              if (!isSavingCompanyEdit) {
                setEditCompanyError(null);
                setCompanyToEdit(null);
              }
            }}
            onSubmit={handleUpdateCompany}
            saveLabel="Update Company"
            saving={isSavingCompanyEdit}
          >
            {editCompanyError && (
              <p className="app-form-error">{editCompanyError}</p>
            )}

            <label className="app-form-field">
              <span>Company Name</span>
              <input
                name="name"
                defaultValue={companyToEdit?.companyName}
                required
              />
            </label>

            <label className="app-form-field">
              <span>Domain</span>
              <input name="domain" defaultValue={companyToEdit?.domain} />
            </label>

            <label className="app-form-field">
              <span>GST Number</span>
              <input
                name="gstNumber"
                defaultValue={companyToEdit?.gstNumber}
              />
            </label>

            <label className="app-form-field">
              <span>Status</span>
              <select name="status" defaultValue={companyToEdit?.status}>
                <option value="Active">Active</option>
                <option value="Pending">Pending</option>
                <option value="Inactive">Inactive</option>
              </select>
            </label>
          </FormModal>

          <FormModal
            title="View Company"
            isOpen={Boolean(companyToView)}
            onClose={() => setCompanyToView(null)}
            onSubmit={() => setCompanyToView(null)}
            saveLabel="Close"
          >
            <label className="app-form-field">
              <span>Company Code</span>
              <input value={companyToView?.companyCode ?? ""} disabled />
            </label>

            <label className="app-form-field">
              <span>Company Name</span>
              <input value={companyToView?.companyName ?? ""} disabled />
            </label>

            <label className="app-form-field">
              <span>Domain</span>
              <input value={companyToView?.domain ?? ""} disabled />
            </label>

            <label className="app-form-field">
              <span>GST Number</span>
              <input value={companyToView?.gstNumber ?? ""} disabled />
            </label>

            <label className="app-form-field">
              <span>Status</span>
              <input value={companyToView?.status ?? ""} disabled />
            </label>
          </FormModal>

          {showDepartments && <DepartmentManagement />}
        </div>
      </section>
    );
  }

  if (activeSection === "departments") {
    return (
      <section className="manage-accounts-page">
        <DepartmentManagement />
      </section>
    );
  }

  if (activeSection === "business-unit") {
    return (
      <section className="manage-accounts-page">
        <OrganizationStructureManagement
          key="business-unit"
          entity="business-unit"
        />
      </section>
    );
  }

  if (activeSection === "branch") {
    return (
      <section className="manage-accounts-page">
        <OrganizationStructureManagement key="branch" entity="branch" />
      </section>
    );
  }

  if (activeSection === "designations") {
    return (
      <section className="manage-accounts-page">
        <OrganizationStructureManagement
          key="designation"
          entity="designation"
        />
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
              <div className="manage-accounts-empty-state">
                Please select a company to view policy records.
              </div>
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
                onAdd={
                  isSystemUser ? () => setIsAddPolicyModalOpen(true) : undefined
                }
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
                showActions={isSystemUser}
                onEdit={isSystemUser ? openPolicyUpdate : undefined}
                onDelete={isSystemUser ? setPolicyToDelete : undefined}
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
          {policySaveError && (
            <p className="app-form-error">{policySaveError}</p>
          )}

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

        <FormModal
          key={`${policyToEdit?.id ?? "new"}-${policyToEdit?.updatedOn ?? policyToEdit?.name ?? ""}`}
          title="Update Policy"
          isOpen={Boolean(policyToEdit)}
          onClose={() => {
            if (!isSavingPolicy) {
              setPolicySaveError(null);
              setPolicyToEdit(null);
            }
          }}
          onSubmit={handleUpdatePolicy}
          saveLabel="Update Policy"
          saving={isSavingPolicy || isLoadingPolicyToEdit}
        >
          {policySaveError && <p className="app-form-error">{policySaveError}</p>}

          <label className="app-form-field">
            <span>Company Code</span>
            <input name="companyCode" value={policyToEdit?.companyCode ?? ""} readOnly />
          </label>

          <label className="app-form-field">
            <span>Policy Name</span>
            <input name="policyName" defaultValue={policyToEdit?.name} required />
          </label>

          <div className="policy-date-fields">
            <label className="app-form-field">
              <span>Start Date</span>
              <input type="date" name="startDate" defaultValue={policyToEdit?.startDate === "N/A" ? "" : policyToEdit?.startDate} required />
            </label>

            <label className="app-form-field">
              <span>End Date</span>
              <input type="date" name="endDate" defaultValue={policyToEdit?.endDate === "N/A" ? "" : policyToEdit?.endDate} />
            </label>
          </div>

          <div className="policy-file-status-fields">
            <label className="app-form-field">
              <span>Policy File (PDF)</span>
              <input type="file" name="policyFile" accept="application/pdf" />
              {policyToEdit?.fileName && <small>Current file: {policyToEdit.fileName}</small>}
            </label>

            <label className="app-form-field">
              <span>Status</span>
              <select name="status" defaultValue={policyToEdit?.status || "ACTIVE"} required>
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
                <option value="DRAFT">Draft</option>
                <option value="EXPIRED">Expired</option>
              </select>
            </label>
          </div>

          <label className="app-form-field">
            <span>Remark</span>
            <textarea name="remark" defaultValue={policyToEdit?.remark} rows={3} />
          </label>
        </FormModal>

        <Modal
          title="Delete Policy"
          isOpen={Boolean(policyToDelete)}
          onClose={() => {
            if (!isDeletingPolicy) {
              setPolicyDeleteError(null);
              setPolicyToDelete(null);
            }
          }}
          footer={
            <>
              <button
                type="button"
                className="app-modal-cancel"
                onClick={() => {
                  setPolicyDeleteError(null);
                  setPolicyToDelete(null);
                }}
                disabled={isDeletingPolicy}
              >
                Cancel
              </button>
              <button
                type="button"
                className="app-modal-save"
                onClick={handleDeletePolicy}
                disabled={isDeletingPolicy}
              >
                {isDeletingPolicy ? "Deleting..." : "Delete"}
              </button>
            </>
          }
        >
          {policyDeleteError && (
            <p className="app-form-error">{policyDeleteError}</p>
          )}
          <p>
            Are you sure you want to delete policy{" "}
            <strong>&quot;{policyToDelete?.name}&quot;</strong>? This action
            cannot be undone.
          </p>
        </Modal>
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
            <h1>{companyDetails?.name ?? "Company Profile"}</h1>
            <p>
              Company Code: <strong>{companyDetails?.code ?? orgCode}</strong>
            </p>
          </div>
          <div className="manage-accounts-code">
            <select
              value={profileCompanyCode ?? orgCode}
              onChange={(e) => setProfileCompanyCode(e.target.value)}
            >
              {/* default option from current orgCode */}
              <option value={orgCode}>{orgCode}</option>
              {companyRows.map((c) => (
                <option key={c.id} value={c.companyCode || c.id}>
                  {c.companyName || c.companyCode || c.id}
                </option>
              ))}
            </select>
          </div>
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
          onClick={async () => {
            if (isSavingCompany) return;

            setIsSavingCompany(true);
            setPolicySaveError(null);

            try {
              const selectedCode = profileCompanyCode ?? orgCode;

              const payload = {
                name: organizationName,
                code: selectedCode,
                domains,
                gstRecords,
              } as Record<string, unknown>;

              const file = inputRef.current?.files?.[0];
              let resp: Response;

              if (file) {
                const form = new FormData();
                form.append("request", JSON.stringify(payload));
                form.append("file", file, file.name);

                resp = await fetch("/api/company/add", {
                  method: "POST",
                  body: form,
                });
              } else {
                resp = await fetch("/api/company/add", {
                  method: "POST",
                  headers: { "content-type": "application/json" },
                  body: JSON.stringify(payload),
                });
              }

              let result: any = null;
              try {
                result = await resp.json();
              } catch {}

              if (!resp.ok) {
                const msg =
                  result?.message ?? result?.error ?? "Unable to save company.";
                setPolicySaveError(String(msg));
                return;
              }

              setSaved(true);
              window.setTimeout(() => setSaved(false), 1800);
            } catch (err) {
              setPolicySaveError(
                err instanceof Error ? err.message : "Unable to save company.",
              );
            } finally {
              setIsSavingCompany(false);
            }
          }}
        >
          {saved ? "Saved" : isSavingCompany ? "Saving..." : "Save Changes"}
        </button>
      </div>
    </section>
  );
}
