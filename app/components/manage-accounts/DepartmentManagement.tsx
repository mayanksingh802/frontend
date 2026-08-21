"use client";

import { useEffect, useMemo, useState } from "react";
import FilterHeaderRow from "@/app/components/ui/FilterHeaderRow";
import ManagementScreen from "@/app/components/system-settings/ManagementScreen";
import { type ManagementColumn } from "@/app/components/system-settings/ManagementTable";
import FormModal from "@/app/components/ui/FormModal";
import Modal from "@/app/components/ui/Modal";
import { useAuth } from "@/app/context/AuthContext";
import { permissions } from "@/app/config/permissions"; 

type DepartmentRow = {
  id: string;
  name: string;
  code: string;
  status?: string;
  remark?: string;
};

function normalizeDepartment(item: Record<string, unknown>): DepartmentRow {
  const id = String(item.id ?? item.departmentId ?? item.code ?? item.name ?? Math.random());
  const name = String(item.name ?? item.departmentName ?? item.deptName ?? "Untitled");
  const code = String(item.code ?? item.departmentCode ?? item.deptCode ?? "");
  const status = String(item.status ?? "Active");
  const remark = String(item.remark ?? "");

  return { id, name, code, status, remark };
}

export default function DepartmentManagement() {
  const [companyRows, setCompanyRows] = useState<Record<string, any>[]>([]);
  const [companyLoading, setCompanyLoading] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<string>("all");
  const [departments, setDepartments] = useState<DepartmentRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);
  const [editingDepartment, setEditingDepartment] = useState<DepartmentRow | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateError, setUpdateError] = useState<string | null>(null);
  const [departmentToDelete, setDepartmentToDelete] = useState<DepartmentRow | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

 const {user, hasAnyRole } = useAuth();
  const companydropdown = hasAnyRole(
  permissions.CompanyDropdown
);

const effectiveCompany = companydropdown
  ? selectedCompany
  : user?.companyCode ?? "";

  const loadCompanies = async () => {
    setCompanyLoading(true);
    try {
      const resp = await fetch("/api/company/all", { headers: { Accept: "application/json" } });
      if (!resp.ok) throw new Error("Unable to fetch companies.");
      const payload = await resp.json();
      const dataArray = Array.isArray(payload)
        ? payload
        : Array.isArray(payload.data)
          ? payload.data
          : Array.isArray(payload.records)
            ? payload.records
            : [];
      setCompanyRows(dataArray as Record<string, any>[]);
    } catch (err) {
      setCompanyRows([]);
    } finally {
      setCompanyLoading(false);
    }
  };

  useEffect(() => {
    if (!companydropdown) {
    return;
  }
    void loadCompanies();
  }, []);

  const companyOptions = useMemo(() => [
    { value: "all", label: "Select Company" },
    ...companyRows.map((c) => ({ value: c.companyCode ?? c.code ?? c.id, label: c.companyName ?? c.name ?? c.companyCode ?? c.id })),
  ], [companyRows]);

  const loadDepartments = async (companyCode: string) => {
    if (!companyCode || companyCode === "all") {
      setDepartments([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const resp = await fetch(`/api/company/${encodeURIComponent(companyCode)}/department`, {
        headers: { Accept: "application/json" },
      });

      if (!resp.ok) {
        const txt = await resp.text();
        throw new Error(txt || "Unable to fetch departments.");
      }

      const payload = await resp.json();
      const dataArray = Array.isArray(payload)
        ? payload
        : Array.isArray(payload.data)
          ? payload.data
          : Array.isArray(payload.records)
            ? payload.records
            : Array.isArray(payload.result)
              ? payload.result
              : [];

      const items = dataArray.map((d: any) => normalizeDepartment(d));
      setDepartments(items);
    } catch (err) {
      setDepartments([]);
      setError(err instanceof Error ? err.message : "Unable to fetch departments.");
    } finally {
      setLoading(false);
    }
  };

  // useEffect(() => {
  //   void loadDepartments(selectedCompany);
  // }, [selectedCompany]);

  useEffect(() => {
  void loadDepartments(effectiveCompany);
}, [effectiveCompany]);

  const handleAddSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setAddError(null);

    // if (!selectedCompany || selectedCompany === "all") {
    //   setAddError("Please select a company before adding a department.");
    //   return;
    // }

    if (!effectiveCompany || effectiveCompany === "all") {
  setAddError("Unable to determine the company.");
  return;
}

    const form = new FormData(event.currentTarget as HTMLFormElement);
    const name = String(form.get("name") ?? "").trim();
    const code = String(form.get("code") ?? "").trim();

    if (!name) {
      setAddError("Department name is required.");
      return;
    }

    try {
      setIsSaving(true);

      const payload: Record<string, unknown> = { name };
      if (code) payload.code = code;

      // const resp = await fetch(`/api/company/${encodeURIComponent(selectedCompany)}/department/add`, {
      const resp = await fetch(`/api/company/${encodeURIComponent(effectiveCompany)}/department/add`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await resp.json().catch(() => null);

      if (!resp.ok) {
        setAddError(result?.message ?? "Unable to add department.");
        return;
      }

      setIsAddOpen(false);
      // await loadDepartments(selectedCompany);
      await loadDepartments(effectiveCompany);
      
    } catch (err) {
      setAddError(err instanceof Error ? err.message : "Unable to add department.");
    } finally {
      setIsSaving(false);
    }
  };

  const closeEditModal = () => {
    if (!isUpdating) {
      setUpdateError(null);
      setEditingDepartment(null);
    }
  };

  const handleUpdateSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setUpdateError(null);

    // if (!selectedCompany || selectedCompany === "all") {
    //   setUpdateError("Please select a company before updating a department.");
    //   return;
    // }

    if (!effectiveCompany || effectiveCompany === "all") {
  setUpdateError("Unable to determine the company.");
  return;
}

    if (!editingDepartment) {
      return;
    }

    const form = new FormData(event.currentTarget as HTMLFormElement);
    const name = String(form.get("name") ?? "").trim();
    const code = String(form.get("code") ?? "").trim();
    const status = String(form.get("status") ?? "ACTIVE").trim();
    const remark = String(form.get("remark") ?? "").trim();

    if (!name) {
      setUpdateError("Department name is required.");
      return;
    }

    try {
      setIsUpdating(true);

      const payload: Record<string, unknown> = { name, status, remark: remark || null };
      if (code) payload.code = code;

      const resp = await fetch(
        // `/api/company/${encodeURIComponent(selectedCompany)}/department/${encodeURIComponent(editingDepartment.id)}`,
        `/api/company/${encodeURIComponent(effectiveCompany)}/department/${encodeURIComponent(editingDepartment.id)}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json", Accept: "application/json" },
          body: JSON.stringify(payload),
        }
      );

      const result = await resp.json().catch(() => null);

      if (!resp.ok) {
        setUpdateError(result?.message ?? "Unable to update department.");
        return;
      }

      setEditingDepartment(null);
      // await loadDepartments(selectedCompany);
      await loadDepartments(effectiveCompany);
    } catch (err) {
      setUpdateError(err instanceof Error ? err.message : "Unable to update department.");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = async (department: DepartmentRow) => {
    if (isDeleting) {
      return;
    }

    // if (!selectedCompany || selectedCompany === "all") {
    //   setDeleteError("Please select a company before deleting a department.");
    //   return;
    // }

    if (!effectiveCompany || effectiveCompany === "all") {
  setDeleteError("Unable to determine the company.");
  return;
}

    try {
      setIsDeleting(true);
      setDeleteError(null);

      const resp = await fetch(
        // `/api/company/${encodeURIComponent(selectedCompany)}/department/${encodeURIComponent(department.id)}`,
        `/api/company/${encodeURIComponent(effectiveCompany)}/department/${encodeURIComponent(department.id)}`,
        {
          method: "DELETE",
          headers: { Accept: "application/json" },
        }
      );

      const result = await resp.json().catch(() => null);

      if (!resp.ok) {
        setDeleteError(result?.message ?? "Unable to delete department.");
        return;
      }

      setDepartmentToDelete(null);
      // await loadDepartments(selectedCompany);
      await loadDepartments(effectiveCompany);
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : "Unable to delete department.");
    } finally {
      setIsDeleting(false);
    }
  };


  const columns: ManagementColumn<DepartmentRow>[] = [
    {
      id: "serialNo",
      label: "S.No.",
      render: (_d: DepartmentRow, index?: number) => (index ?? 0) + 1,
      exportValue: (_d: DepartmentRow, index?: number) => (index ?? 0) + 1,
    },
    { id: "name", label: "Name", render: (d: DepartmentRow) => d.name, exportValue: (d: DepartmentRow) => d.name },
    { id: "code", label: "Code", render: (d: DepartmentRow) => d.code, exportValue: (d: DepartmentRow) => d.code },
    {
      id: "status",
      label: "Status",
      render: (d: DepartmentRow) => {
        const status = d.status ?? "";

        return (
          <span
            className={`manage-accounts-status manage-accounts-status-${status.toLowerCase()}`}
          >
            {status}
          </span>
        );
      },
      exportValue: (d: DepartmentRow) => d.status ?? "",
    },
  ];

  return (
    <div className="manage-accounts-card" style={{ marginTop: 16 }}>
      <div className="manage-accounts-policy-header-row">
        <div className="manage-accounts-policy-title-block">
          <h1 className="manage-accounts-policy-title">Departments</h1>
        </div>

        <div className="manage-accounts-policy-toolbar">
           {companydropdown && (
          <FilterHeaderRow
            title=""
            value={selectedCompany}
            options={companyOptions}
            onChange={setSelectedCompany}
            searchPlaceholder="Search company or org"
            emptyMessage="No company/org found."
          />)}
          <div style={{ marginLeft: 8 }}>
            <button
              type="button"
              className="manage-accounts-outline-button"
              onClick={() => setIsAddOpen(true)}
            >
              Add Department
            </button>
          </div>
        </div>
      </div>

      <ManagementScreen
        title="Departments"
        entityName="Department"
        items={departments}
        columns={columns}
        loading={loading}
        error={error}
        showHeader={false}
        showSearch={true}
        // onRefresh={() => void loadDepartments(selectedCompany)}
        onRefresh={() => void loadDepartments(effectiveCompany)}
        onAdd={() => setIsAddOpen(true)}
        getRowId={(d: DepartmentRow) => d.id}
        getRowLabel={(d: DepartmentRow) => d.name}
        getSearchValues={(d: DepartmentRow) => [d.name, d.code, d.status]}
        emptyMessage="No departments found for this company."
        showActions={true}
        onEdit={(department: DepartmentRow) => {
          setUpdateError(null);
          setEditingDepartment(department);
        }}
        onDelete={(department: DepartmentRow) => {
          setDeleteError(null);
          setDepartmentToDelete(department);
        }}
      />

      <FormModal
        title="Add Department"
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        onSubmit={handleAddSubmit}
        saveLabel="Save Department"
        saving={isSaving}
      >
        {addError && <div className="app-form-error">{addError}</div>}

        <label className="app-form-field">
          <span>Department Name</span>
          <input name="name" required />
        </label>

        <label className="app-form-field">
          <span>Department Code</span>
          <input name="code" />
        </label>
      </FormModal>

      <FormModal
        title="Edit Department"
        isOpen={Boolean(editingDepartment)}
        onClose={closeEditModal}
        onSubmit={handleUpdateSubmit}
        saveLabel="Update Department"
        saving={isUpdating}
      >
        {editingDepartment && (
          <>
            {updateError && <div className="app-form-error">{updateError}</div>}

            <label className="app-form-field">
              <span>Department Name</span>
              <input name="name" defaultValue={editingDepartment.name} required />
            </label>

            <label className="app-form-field">
              <span>Department Code</span>
              <input
                name="code"
                defaultValue={editingDepartment.code}
                readOnly
              />
            </label>

            <label className="app-form-field">
              <span>Status</span>
              <select name="status" defaultValue={editingDepartment.status || "ACTIVE"}>
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
              </select>
            </label>

            <label className="app-form-field">
              <span>Remark</span>
              <textarea name="remark" rows={3} defaultValue={editingDepartment.remark ?? ""} />
            </label>
          </>
        )}
      </FormModal>

      <Modal
        title="Confirm Delete"
        isOpen={Boolean(departmentToDelete)}
        onClose={() => setDepartmentToDelete(null)}
        footer={
          <>
            <button
              type="button"
              className="app-modal-cancel"
              onClick={() => setDepartmentToDelete(null)}
              disabled={isDeleting}
            >
              Cancel
            </button>
            <button
              type="button"
              className="app-modal-save"
              onClick={() => departmentToDelete && handleDelete(departmentToDelete)}
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </button>
          </>
        }
      >
        {deleteError && <div className="app-form-error">{deleteError}</div>}
        <p>
          Are you sure you want to delete the department{" "}
          <strong>"{departmentToDelete?.name}"</strong>? This cannot be
          undone.
        </p>
      </Modal>
    </div>
  );
}
