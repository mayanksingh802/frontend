"use client";

import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import ManagementScreen from "@/app/components/system-settings/ManagementScreen";
import type { ManagementColumn } from "@/app/components/system-settings/ManagementTable";
import FilterHeaderRow from "@/app/components/ui/FilterHeaderRow";
import FormModal from "@/app/components/ui/FormModal";
import Modal from "@/app/components/ui/Modal";
import { useAuth } from "@/app/context/AuthContext";
import { permissions } from "@/app/config/permissions";

export type OrganizationStructureEntity =
  | "business-unit"
  | "branch"
  | "designation";

type StructureRow = {
  id: string;
  name: string;
  code: string;
  // manager: string;
  type: string;
  email: string;
  number: string;
  address: string;
  addressDetails: {
    line1: string;
    line2: string;
    city: string;
    state: string;
    country: string;
    pincode: string;
  };
  status: string;
  remark: string;
};

type EntityConfig = {
  singular: string;
  plural: string;
};

const ENTITY_CONFIG: Record<OrganizationStructureEntity, EntityConfig> = {
  "business-unit": {
    singular: "Business Unit",
    plural: "Business Units",
  },
  branch: {
    singular: "Branch",
    plural: "Branches",
  },
  designation: {
    singular: "Designation",
    plural: "Designations",
  },
};

const extractCompanyRows = (payload: unknown): Record<string, unknown>[] => {
  if (Array.isArray(payload)) {
    return payload as Record<string, unknown>[];
  }

  if (!payload || typeof payload !== "object") {
    return [];
  }

  const response = payload as Record<string, unknown>;

  for (const key of ["data", "records", "result"]) {
    if (Array.isArray(response[key])) {
      return response[key] as Record<string, unknown>[];
    }
  }

  return [];
};

const normalizeBranchRow = (item: Record<string, unknown>): StructureRow => {
  const address =
    item.address && typeof item.address === "object"
      ? (item.address as Record<string, unknown>)
      : null;
  const formattedAddress = address
    ? [
        address.line1,
        address.line2,
        address.city,
        address.state,
        address.pincode,
        address.country,
      ]
        .filter((part) => part !== null && part !== undefined && part !== "")
        .map(String)
        .join(", ")
    : "";

  return {
    id: String(item.id ?? item.branchId ?? item.code ?? item.name ?? ""),
    name: String(item.name ?? item.branchName ?? "Untitled Branch"),
    code: String(item.code ?? item.branchCode ?? ""),
    // manager: String(item.manager ?? item.branchManager ?? item.head ?? ""),
    type: String(item.type ?? ""),
    email: String(item.email ?? ""),
    number: String(item.number ?? item.phoneNumber ?? ""),
    address: formattedAddress,
    addressDetails: {
      line1: String(address?.line1 ?? ""),
      line2: String(address?.line2 ?? ""),
      city: String(address?.city ?? ""),
      state: String(address?.state ?? ""),
      country: String(address?.country ?? ""),
      pincode: String(address?.pincode ?? ""),
    },
    status: String(item.status ?? "Active"),
    remark: String(item.remark ?? ""),
  };
};

const normalizeBusinessUnitRow = (
  item: Record<string, unknown>,
): StructureRow => ({
  id: String(
    item.id ?? item.businessUnitId ?? item.businessUnitCode ?? item.code ?? "",
  ),
  name: String(item.name ?? item.businessUnitName ?? "Untitled Business Unit"),
  code: String(item.code ?? item.businessUnitCode ?? ""),
  // manager: String(
  //   item.manager ?? item.businessUnitManager ?? item.head ?? item.managerName ?? "",
  // ),
  type: "",
  email: "",
  number: "",
  address: "",
  addressDetails: {
    line1: "",
    line2: "",
    city: "",
    state: "",
    country: "",
    pincode: "",
  },
  status: String(item.status ?? "Active"),
  remark: String(item.remark ?? ""),
});

const normalizeDesignationRow = (item: Record<string, unknown>): StructureRow => ({
  id: String(item.id ?? item.designationId ?? item.code ?? item.name ?? ""),
  name: String(item.name ?? item.designationName ?? "Untitled Designation"),
  code: String(item.code ?? item.designationCode ?? ""),
  // manager: "",
  type: "",
  email: "",
  number: "",
  address: "",
  addressDetails: {
    line1: "",
    line2: "",
    city: "",
    state: "",
    country: "",
    pincode: "",
  },
  status: String(item.status ?? "Active"),
  remark: String(item.remark ?? ""),
});

interface OrganizationStructureManagementProps {
  entity: OrganizationStructureEntity;
}

export default function OrganizationStructureManagement({
  entity,
}: OrganizationStructureManagementProps) {
  const config = ENTITY_CONFIG[entity];
  const [companyRows, setCompanyRows] = useState<Record<string, unknown>[]>([]);
  const [selectedCompany, setSelectedCompany] = useState("all");
  const [rowsByCompany, setRowsByCompany] = useState<
    Record<string, StructureRow[]>
  >({});
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);
  const [editingRow, setEditingRow] = useState<StructureRow | null>(null);
  const [updateError, setUpdateError] = useState<string | null>(null);
  const [rowToDelete, setRowToDelete] = useState<StructureRow | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const structureRequestController = useRef<AbortController | null>(null);
  const { user, hasAnyRole } = useAuth();

    const companydropdown = hasAnyRole(
  permissions.CompanyDropdown
);
  useEffect(() => {
if (!companydropdown) {
    return;
  }

    const controller = new AbortController();

    const loadCompanies = async () => {
      try {
        const response = await fetch("/api/company/all", {
          headers: { Accept: "application/json" },
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error("Unable to fetch companies.");
        }

        setCompanyRows(extractCompanyRows(await response.json()));
      } catch (error) {
        if (error instanceof Error && error.name === "AbortError") {
          return;
        }

        setCompanyRows([]);
      }
    };

    void loadCompanies();

    return () => controller.abort();
  }, []);

  const loadBranches = async (companyCode: string, signal?: AbortSignal) => {
    if (entity !== "branch" || !companyCode || companyCode === "all") {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/company/${encodeURIComponent(companyCode)}/branch`,
        {
          headers: { Accept: "application/json" },
          signal,
        },
      );

      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        throw new Error(payload?.message ?? "Unable to fetch branches.");
      }

      const branchRows = extractCompanyRows(await response.json()).map(
        normalizeBranchRow,
      );

      setRowsByCompany((current) => ({
        ...current,
        [companyCode]: branchRows,
      }));
    } catch (loadError) {
      if (loadError instanceof Error && loadError.name === "AbortError") {
        return;
      }

      setRowsByCompany((current) => ({
        ...current,
        [companyCode]: [],
      }));
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Unable to fetch branches.",
      );
    } finally {
      if (!signal?.aborted) {
        setLoading(false);
      }
    }
  };

  const loadBusinessUnits = async (
    companyCode: string,
    signal?: AbortSignal,
  ) => {
    if (entity !== "business-unit" || !companyCode || companyCode === "all") {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/company/${encodeURIComponent(companyCode)}/business-unit`,
        {
          headers: { Accept: "application/json" },
          signal,
        },
      );

      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        throw new Error(payload?.message ?? "Unable to fetch business units.");
      }

      const businessUnitRows = extractCompanyRows(await response.json()).map(
        normalizeBusinessUnitRow,
      );

      setRowsByCompany((current) => ({
        ...current,
        [companyCode]: businessUnitRows,
      }));
    } catch (loadError) {
      if (loadError instanceof Error && loadError.name === "AbortError") {
        return;
      }

      setRowsByCompany((current) => ({ ...current, [companyCode]: [] }));
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Unable to fetch business units.",
      );
    } finally {
      if (!signal?.aborted) {
        setLoading(false);
      }
    }
  };

  const loadDesignations = async (
    companyCode: string,
    signal?: AbortSignal,
  ) => {
    if (entity !== "designation" || !companyCode || companyCode === "all") {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/company/${encodeURIComponent(companyCode)}/designation`,
        {
          headers: { Accept: "application/json" },
          signal,
        },
      );

      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        throw new Error(payload?.message ?? "Unable to fetch designations.");
      }

      const designationRows = extractCompanyRows(await response.json()).map(
        normalizeDesignationRow,
      );

      setRowsByCompany((current) => ({
        ...current,
        [companyCode]: designationRows,
      }));
    } catch (loadError) {
      if (loadError instanceof Error && loadError.name === "AbortError") {
        return;
      }

      setRowsByCompany((current) => ({ ...current, [companyCode]: [] }));
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Unable to fetch designations.",
      );
    } finally {
      if (!signal?.aborted) {
        setLoading(false);
      }
    }
  };

  useEffect(() => () => structureRequestController.current?.abort(), []);

  const handleCompanyChange = (companyCode: string) => {
    structureRequestController.current?.abort();
    setSelectedCompany(companyCode);
    setError(null);

    if (
      (entity !== "branch" &&
        entity !== "business-unit" &&
        entity !== "designation") ||
      companyCode === "all"
    ) {
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    structureRequestController.current = controller;

    if (entity === "business-unit") {
      void loadBusinessUnits(companyCode, controller.signal);
    } else if (entity === "designation") {
      void loadDesignations(companyCode, controller.signal);
    } else {
      void loadBranches(companyCode, controller.signal);
    }
  };

  const refreshBranches = async () => {
    if (entity !== "branch" || selectedCompany === "all") {
      return;
    }

    structureRequestController.current?.abort();
    const controller = new AbortController();
    structureRequestController.current = controller;
    await loadBranches(selectedCompany, controller.signal);
  };

  const refreshBusinessUnits = async () => {
    if (entity !== "business-unit" || selectedCompany === "all") {
      return;
    }

    structureRequestController.current?.abort();
    const controller = new AbortController();
    structureRequestController.current = controller;
    await loadBusinessUnits(selectedCompany, controller.signal);
  };

  const refreshDesignations = async () => {
    if (entity !== "designation" || selectedCompany === "all") {
      return;
    }

    structureRequestController.current?.abort();
    const controller = new AbortController();
    structureRequestController.current = controller;
    await loadDesignations(selectedCompany, controller.signal);
  };

  const companyOptions = useMemo(
    () => [
      { value: "all", label: "Select Company" },
      ...companyRows.map((company) => {
        const value = String(
          company.companyCode ?? company.code ?? company.id ?? "",
        );
        const label = String(
          company.companyName ?? company.name ?? value ?? "Unknown company",
        );

        return { value, label };
      }),
    ],
    [companyRows],
  );

  const rows =
    selectedCompany === "all" ? [] : (rowsByCompany[selectedCompany] ?? []);

  const columns = useMemo<ManagementColumn<StructureRow>[]>(() => {
    const commonColumns: ManagementColumn<StructureRow>[] = [
      {
        id: "serialNo",
        label: "S.No.",
        render: (_row, index) => (index ?? 0) + 1,
        exportValue: (_row, index) => (index ?? 0) + 1,
      },
      {
        id: "name",
        label: "Name",
        render: (row) => row.name,
        exportValue: (row) => row.name,
      },
      {
        id: "code",
        label: "Code",
        render: (row) => row.code,
        exportValue: (row) => row.code,
      },
    ];

    if (entity === "branch") {
      commonColumns.push(
        {
          id: "type",
          label: "Type",
          render: (row) => row.type,
          exportValue: (row) => row.type,
        },
        {
          id: "email",
          label: "Email",
          render: (row) => row.email,
          exportValue: (row) => row.email,
        },
        {
          id: "number",
          label: "Number",
          render: (row) => row.number,
          exportValue: (row) => row.number,
        },
        {
          id: "address",
          label: "Address",
          render: (row) => row.address,
          exportValue: (row) => row.address,
        },
      );
    } 
    // else {
    //   commonColumns.push({
    //     id: "manager",
    //     label: "Manager",
    //     render: (row) => row.manager,
    //     exportValue: (row) => row.manager,
    //   });
    // }

    commonColumns.push({
      id: "status",
      label: "Status",
      render: (row) => (
        <span
          className={`manage-accounts-status manage-accounts-status-${row.status.toLowerCase()}`}
        >
          {row.status}
        </span>
      ),
      exportValue: (row) => row.status,
    });

    return commonColumns;
  }, [entity]);

  const addRow = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setAddError(null);

    if (selectedCompany === "all") {
      setAddError(
        `Please select a company before adding a ${config.singular.toLowerCase()}.`,
      );
      return;
    }

    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const name = String(form.get("name") ?? "").trim();
    const code = String(form.get("code") ?? "").trim();

    if (entity === "branch") {
      const type = String(form.get("type") ?? "").trim();
      const email = String(form.get("email") ?? "").trim();
      const number = String(form.get("number") ?? "").trim();
      const line1 = String(form.get("line1") ?? "").trim();
      const line2 = String(form.get("line2") ?? "").trim();
      const city = String(form.get("city") ?? "").trim();
      const state = String(form.get("state") ?? "").trim();
      const country = String(form.get("country") ?? "").trim();
      const pincode = Number(form.get("pincode"));

      if (
        !name ||
        !code ||
        !type ||
        !email ||
        !number ||
        !line1 ||
        !city ||
        !state ||
        !country ||
        !Number.isInteger(pincode) ||
        pincode <= 0
      ) {
        setAddError("Please complete all required branch and address fields.");
        return;
      }

      try {
        setIsSaving(true);
        const response = await fetch(
          `/api/company/${encodeURIComponent(selectedCompany)}/branch/add`,
          {
            method: "POST",
            headers: {
              Accept: "application/json",
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              code,
              type,
              name,
              email,
              number,
              address: { line1, line2, city, state, country, pincode },
            }),
          },
        );
        const payload = await response.json().catch(() => null);

        if (!response.ok) {
          throw new Error(payload?.message ?? "Unable to add branch.");
        }

        setIsAddOpen(false);
        formElement.reset();
        await refreshBranches();
      } catch (saveError) {
        setAddError(
          saveError instanceof Error
            ? saveError.message
            : "Unable to add branch.",
        );
      } finally {
        setIsSaving(false);
      }

      return;
    }

    if (entity === "business-unit") {
      try {
        setIsSaving(true);
        const response = await fetch(
          `/api/company/${encodeURIComponent(selectedCompany)}/business-unit/add`,
          {
            method: "POST",
            headers: {
              Accept: "application/json",
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ name, code }),
          },
        );
        const payload = await response.json().catch(() => null);

        if (!response.ok) {
          throw new Error(payload?.message ?? "Unable to add business unit.");
        }

        setIsAddOpen(false);
        formElement.reset();
        await refreshBusinessUnits();
      } catch (saveError) {
        setAddError(
          saveError instanceof Error
            ? saveError.message
            : "Unable to add business unit.",
        );
      } finally {
        setIsSaving(false);
      }

      return;
    }

    if (entity === "designation") {
      if (!name || !code) {
        setAddError("Designation name and code are required.");
        return;
      }

      try {
        setIsSaving(true);
        const response = await fetch(
          `/api/company/${encodeURIComponent(selectedCompany)}/designation/add`,
          {
            method: "POST",
            headers: {
              Accept: "application/json",
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ name, code }),
          },
        );
        const payload = await response.json().catch(() => null);

        if (!response.ok) {
          throw new Error(payload?.message ?? "Unable to add designation.");
        }

        setIsAddOpen(false);
        formElement.reset();
        await refreshDesignations();
      } catch (saveError) {
        setAddError(
          saveError instanceof Error
            ? saveError.message
            : "Unable to add designation.",
        );
      } finally {
        setIsSaving(false);
      }

      return;
    }

    if (!name) {
      setAddError(`${config.singular} name is required.`);
      return;
    }

    const row: StructureRow = {
      id: crypto.randomUUID(),
      name,
      code,
      // manager: "",
      type: "",
      email: "",
      number: "",
      address: "",
      addressDetails: {
        line1: "",
        line2: "",
        city: "",
        state: "",
        country: "",
        pincode: "",
      },
      status: "Active",
      remark: "",
    };

    setRowsByCompany((current) => ({
      ...current,
      [selectedCompany]: [...(current[selectedCompany] ?? []), row],
    }));
    setIsAddOpen(false);
    formElement.reset();
  };

  const updateRow = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setUpdateError(null);

    if (selectedCompany === "all") {
      setUpdateError(
        `Please select a company before updating a ${config.singular.toLowerCase()}.`,
      );
      return;
    }

    if (!editingRow) {
      return;
    }

    const form = new FormData(event.currentTarget);
    const name = String(form.get("name") ?? "").trim();
    const code = String(form.get("code") ?? "").trim();
    const status = String(form.get("status") ?? "ACTIVE").trim();
    const remark = String(form.get("remark") ?? "").trim();

    if (entity === "branch") {
      const type = String(form.get("type") ?? "").trim();
      const email = String(form.get("email") ?? "").trim();
      const number = String(form.get("number") ?? "").trim();
      const line1 = String(form.get("line1") ?? "").trim();
      const line2 = String(form.get("line2") ?? "").trim();
      const city = String(form.get("city") ?? "").trim();
      const state = String(form.get("state") ?? "").trim();
      const country = String(form.get("country") ?? "").trim();
      const pincode = Number(form.get("pincode"));

      if (
        !name ||
        !code ||
        !type ||
        !email ||
        !number ||
        !line1 ||
        !city ||
        !state ||
        !country ||
        !Number.isInteger(pincode) ||
        pincode <= 0
      ) {
        setUpdateError(
          "Please complete all required branch and address fields.",
        );
        return;
      }

      try {
        setIsUpdating(true);
        const response = await fetch(
          `/api/company/${encodeURIComponent(selectedCompany)}/branch/${encodeURIComponent(editingRow.id)}`,
          {
            method: "PUT",
            headers: {
              Accept: "application/json",
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              code,
              type,
              name,
              email,
              number,
              address: { line1, line2, city, state, country, pincode },
              status,
              remark: remark || null,
            }),
          },
        );
        const payload = await response.json().catch(() => null);

        if (!response.ok) {
          throw new Error(payload?.message ?? "Unable to update branch.");
        }

        setEditingRow(null);
        await refreshBranches();
      } catch (saveError) {
        setUpdateError(
          saveError instanceof Error
            ? saveError.message
            : "Unable to update branch.",
        );
      } finally {
        setIsUpdating(false);
      }

      return;
    }

    if (entity === "business-unit") {
      if (!name) {
        setUpdateError("Business Unit name is required.");
        return;
      }

      try {
        setIsUpdating(true);
        const response = await fetch(
          `/api/company/${encodeURIComponent(selectedCompany)}/business-unit/${encodeURIComponent(editingRow.id)}`,
          {
            method: "PUT",
            headers: {
              Accept: "application/json",
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ name, code, status, remark: remark || null }),
          },
        );
        const payload = await response.json().catch(() => null);

        if (!response.ok) {
          throw new Error(payload?.message ?? "Unable to update business unit.");
        }

        setEditingRow(null);
        await refreshBusinessUnits();
      } catch (saveError) {
        setUpdateError(
          saveError instanceof Error
            ? saveError.message
            : "Unable to update business unit.",
        );
      } finally {
        setIsUpdating(false);
      }

      return;
    }

    if (entity === "designation") {
      if (!name) {
        setUpdateError("Designation name is required.");
        return;
      }

      try {
        setIsUpdating(true);
        const response = await fetch(
          `/api/company/${encodeURIComponent(selectedCompany)}/designation/${encodeURIComponent(editingRow.id)}`,
          {
            method: "PUT",
            headers: {
              Accept: "application/json",
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ name, code, status, remark: remark || null }),
          },
        );
        const payload = await response.json().catch(() => null);

        if (!response.ok) {
          throw new Error(payload?.message ?? "Unable to update designation.");
        }

        setEditingRow(null);
        await refreshDesignations();
      } catch (saveError) {
        setUpdateError(
          saveError instanceof Error
            ? saveError.message
            : "Unable to update designation.",
        );
      } finally {
        setIsUpdating(false);
      }

      return;
    }

    if (!name) {
      setUpdateError(`${config.singular} name is required.`);
      return;
    }

    setRowsByCompany((current) => ({
      ...current,
      [selectedCompany]: (current[selectedCompany] ?? []).map((row) =>
        row.id === editingRow.id ? { ...row, name, code, status, remark } : row,
      ),
    }));
    setEditingRow(null);
  };

  const deleteRow = async () => {
    if (!rowToDelete || selectedCompany === "all" || isDeleting) {
      return;
    }

    if (entity === "business-unit") {
      try {
        setError(null);
        setIsDeleting(true);

        const response = await fetch(
          `/api/company/${encodeURIComponent(selectedCompany)}/business-unit/${encodeURIComponent(rowToDelete.id)}`,
          {
            method: "DELETE",
            headers: { Accept: "application/json" },
          },
        );
        const payload = await response.json().catch(() => null);

        if (!response.ok) {
          throw new Error(payload?.message ?? "Unable to delete business unit.");
        }

        setRowToDelete(null);
        await refreshBusinessUnits();
      } catch (deleteError) {
        setError(
          deleteError instanceof Error
            ? deleteError.message
            : "Unable to delete business unit.",
        );
      } finally {
        setIsDeleting(false);
      }

      return;
    }

    if (entity === "designation") {
      try {
        setError(null);
        setIsDeleting(true);

        const response = await fetch(
          `/api/company/${encodeURIComponent(selectedCompany)}/designation/${encodeURIComponent(rowToDelete.id)}`,
          {
            method: "DELETE",
            headers: { Accept: "application/json" },
          },
        );
        const payload = await response.json().catch(() => null);

        if (!response.ok) {
          throw new Error(payload?.message ?? "Unable to delete designation.");
        }

        setRowToDelete(null);
        await refreshDesignations();
      } catch (deleteError) {
        setError(
          deleteError instanceof Error
            ? deleteError.message
            : "Unable to delete designation.",
        );
      } finally {
        setIsDeleting(false);
      }

      return;
    }

    if (entity !== "branch") {
      setRowsByCompany((current) => ({
        ...current,
        [selectedCompany]: (current[selectedCompany] ?? []).filter(
          (row) => row.id !== rowToDelete.id,
        ),
      }));
      setRowToDelete(null);
      return;
    }

    try {
      setError(null);
      setIsDeleting(true);

      const response = await fetch(
        `/api/company/${encodeURIComponent(selectedCompany)}/branch/${encodeURIComponent(rowToDelete.id)}`,
        {
          method: "DELETE",
          headers: { Accept: "application/json" },
        },
      );
      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(payload?.message ?? "Unable to delete branch.");
      }

      setRowToDelete(null);
      await refreshBranches();
    } catch (deleteError) {
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : "Unable to delete branch.",
      );
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="manage-accounts-card" style={{ marginTop: 16 }}>
      <div className="manage-accounts-policy-header-row">
        <div className="manage-accounts-policy-title-block">
          <h1 className="manage-accounts-policy-title">{config.plural}</h1>
        </div>

        <div className="manage-accounts-policy-toolbar">
          {companydropdown && (
          <FilterHeaderRow
            title=""
            value={selectedCompany}
            options={companyOptions}
            onChange={handleCompanyChange}
            searchPlaceholder="Search company or org"
            emptyMessage="No company/org found."
          />
          )}
          <div style={{ marginLeft: 8 }}>
            <button
              type="button"
              className="manage-accounts-outline-button"
              onClick={() => {
                setAddError(null);
                setIsAddOpen(true);
              }}
            >
              Add {config.singular}
            </button>
          </div>
        </div>
      </div>

      <ManagementScreen
        title={config.plural}
        entityName={config.singular}
        items={rows}
        columns={columns}
        loading={
          entity === "branch" ||
          entity === "business-unit" ||
          entity === "designation"
            ? loading
            : false
        }
        error={
          entity === "branch" ||
          entity === "business-unit" ||
          entity === "designation"
            ? error
            : null
        }
        showHeader={false}
        showSearch={true}
        onRefresh={
          entity === "business-unit"
            ? refreshBusinessUnits
            : entity === "designation"
              ? refreshDesignations
              : refreshBranches
        }
        onAdd={() => {
          setAddError(null);
          setIsAddOpen(true);
        }}
        getRowId={(row) => row.id}
        getRowLabel={(row) => row.name}
        getSearchValues={(row) => [
          row.name,
          row.code,
          row.type,
          row.email,
          row.number,
          row.address,
          row.status,
        ]}
        emptyMessage={`No ${config.plural.toLowerCase()} found for this company.`}
        showActions={true}
        onEdit={(row) => {
          setUpdateError(null);
          setEditingRow(row);
        }}
        onDelete={setRowToDelete}
      />

      <FormModal
        title={`Add ${config.singular}`}
        isOpen={isAddOpen}
        onClose={() => {
          setAddError(null);
          setIsAddOpen(false);
        }}
        onSubmit={addRow}
        saveLabel={`Save ${config.singular}`}
        saving={isSaving}
        formClassName={entity === "branch" ? "branch-form" : ""}
      >
        {addError && <div className="app-form-error">{addError}</div>}

        <div className={entity === "branch" ? "branch-form-grid" : ""}>
          <label className="app-form-field">
            <span>{config.singular} Name</span>
            <input name="name" required />
          </label>

          <label className="app-form-field">
            <span>{config.singular} Code</span>
            <input
              name="code"
              required={entity === "branch" || entity === "designation"}
            />
          </label>

          {entity === "branch" && (
            <>
              <label className="app-form-field">
                <span>Type</span>
                <select name="type" defaultValue="HEAD_OFFICE" required>
                  <option value="HEAD_OFFICE">Head Office</option>
                  <option value="BRANCH_OFFICE">Branch Office</option>
                </select>
              </label>

              <label className="app-form-field">
                <span>Email</span>
                <input name="email" type="email" required />
              </label>

              <label className="app-form-field">
                <span>Number</span>
                <input name="number" type="tel" required />
              </label>

              <label className="app-form-field">
                <span>Country</span>
                <input name="country" required />
              </label>

              <label className="app-form-field branch-form-full">
                <span>Address Line 1</span>
                <input name="line1" required />
              </label>

              <label className="app-form-field branch-form-full">
                <span>Address Line 2</span>
                <input name="line2" />
              </label>

              <label className="app-form-field">
                <span>City</span>
                <input name="city" required />
              </label>

              <label className="app-form-field">
                <span>State</span>
                <input name="state" required />
              </label>

              <label className="app-form-field">
                <span>Pincode</span>
                <input name="pincode" type="number" min="1" step="1" required />
              </label>
            </>
          )}
        </div>
      </FormModal>

      <FormModal
        title={`Edit ${config.singular}`}
        isOpen={Boolean(editingRow)}
        onClose={() => {
          if (!isUpdating) {
            setUpdateError(null);
            setEditingRow(null);
          }
        }}
        onSubmit={updateRow}
        saveLabel={`Update ${config.singular}`}
        saving={isUpdating}
        formClassName={entity === "branch" ? "branch-form" : ""}
      >
        {editingRow && (
          <>
            {updateError && <div className="app-form-error">{updateError}</div>}

            <div className={entity === "branch" ? "branch-form-grid" : ""}>
              <label className="app-form-field">
                <span>{config.singular} Name</span>
                <input name="name" defaultValue={editingRow.name} required />
              </label>

              <label className="app-form-field">
                <span>{config.singular} Code</span>
                <input
                  name="code"
                  defaultValue={editingRow.code}
                  required={entity === "branch"}
                  readOnly={
                    entity === "business-unit" ||
                    entity === "branch" ||
                    entity === "designation"
                  }
                />
              </label>

              {entity === "branch" && (
                <>
                  <label className="app-form-field">
                    <span>Type</span>
                    <select name="type" defaultValue={editingRow.type} required>
                      <option value="HEAD_OFFICE">Head Office</option>
                      <option value="BRANCH_OFFICE">Branch Office</option>
                    </select>
                  </label>

                  <label className="app-form-field">
                    <span>Email</span>
                    <input
                      name="email"
                      type="email"
                      defaultValue={editingRow.email}
                      required
                    />
                  </label>

                  <label className="app-form-field">
                    <span>Number</span>
                    <input
                      name="number"
                      type="tel"
                      defaultValue={editingRow.number}
                      required
                    />
                  </label>

                  <label className="app-form-field">
                    <span>Country</span>
                    <input
                      name="country"
                      defaultValue={editingRow.addressDetails.country}
                      required
                    />
                  </label>

                  <div className="branch-form-full branch-address-fields">
                    <label className="app-form-field">
                      <span>Address Line 1</span>
                      <input
                        name="line1"
                        defaultValue={editingRow.addressDetails.line1}
                        required
                      />
                    </label>

                    <label className="app-form-field">
                      <span>Address Line 2</span>
                      <input
                        name="line2"
                        defaultValue={editingRow.addressDetails.line2}
                      />
                    </label>
                  </div>

                  <label className="app-form-field">
                    <span>City</span>
                    <input
                      name="city"
                      defaultValue={editingRow.addressDetails.city}
                      required
                    />
                  </label>

                  <label className="app-form-field">
                    <span>State</span>
                    <input
                      name="state"
                      defaultValue={editingRow.addressDetails.state}
                      required
                    />
                  </label>

                  <label className="app-form-field">
                    <span>Pincode</span>
                    <input
                      name="pincode"
                      type="number"
                      min="1"
                      step="1"
                      defaultValue={editingRow.addressDetails.pincode}
                      required
                    />
                  </label>
                </>
              )}

              <label className="app-form-field">
                <span>Status</span>
                <select name="status" defaultValue={editingRow.status || "ACTIVE"}>
                  <option value="ACTIVE">Active</option>
                  <option value="INACTIVE">Inactive</option>
                </select>
              </label>

              <label className={`app-form-field ${entity === "branch" ? "branch-form-full" : ""}`}>
                <span>Remark</span>
                <textarea name="remark" rows={3} defaultValue={editingRow.remark} />
              </label>
            </div>
          </>
        )}
      </FormModal>

      <Modal
        title="Confirm Delete"
        isOpen={Boolean(rowToDelete)}
        onClose={() => {
          if (!isDeleting) {
            setRowToDelete(null);
          }
        }}
        footer={
          <>
            <button
              type="button"
              className="app-modal-cancel"
              onClick={() => setRowToDelete(null)}
              disabled={isDeleting}
            >
              Cancel
            </button>
            <button
              type="button"
              className="app-modal-save"
              onClick={deleteRow}
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </button>
          </>
        }
      >
        <p>
          Are you sure you want to delete the {config.singular.toLowerCase()}{" "}
          <strong>&quot;{rowToDelete?.name}&quot;</strong>? This cannot be
          undone.
        </p>
      </Modal>
    </div>
  );
}
