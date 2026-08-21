"use client";

import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import ManagementScreen from "@/app/components/system-settings/ManagementScreen";
import type { ManagementColumn } from "@/app/components/system-settings/ManagementTable";
import FilterHeaderRow from "@/app/components/ui/FilterHeaderRow";
import FormModal from "@/app/components/ui/FormModal";
import Modal from "@/app/components/ui/Modal";
import { useAuth } from "@/app/context/AuthContext";
import { permissions } from "@/app/config/permissions";

type UserRow = {
  id: string;
  name: string;
  email: string;
  role: string;
  mobileNumber: string;
  alternateNumber: string;
  status: string;
  remark: string;
};

const extractArray = (payload: unknown): Record<string, unknown>[] => {
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

const normalizeUserRow = (item: Record<string, unknown>): UserRow => ({
  id: String(item.id ?? item.userId ?? item.code ?? item.email ?? ""),
  name: String(item.displayName ?? item.name ?? item.userName ?? "Untitled User"),
  email: String(item.email ?? ""),
  role: String(item.role ?? item.roles ?? ""),
  mobileNumber: String(item.mobileNumber ?? item.phone ?? ""),
  alternateNumber: String(item.alternateNumber ?? ""),
  status: String(item.enabled ?? item.status ?? "Active"),
  remark: String(item.remark ?? ""),
});

export default function UserManagement() {
  const { user, hasAnyRole } = useAuth();
  const canSelectCompany = hasAnyRole(permissions.CompanyDropdown);
  // const userCompanyCode = user?.companyCode ?? "";
  const userCompanyCode = String(user?.companyCode ?? "").trim().toUpperCase();
  const [companyRows, setCompanyRows] = useState<Record<string, unknown>[]>([]);
  const [selectedCompany, setSelectedCompany] = useState(
    canSelectCompany ? "all" : userCompanyCode,
  );
  console.log(selectedCompany,'selected');
  const [rowsByCompany, setRowsByCompany] = useState<Record<string, UserRow[]>>(
    {},
  );
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);
  const [editingRow, setEditingRow] = useState<UserRow | null>(null);
  const [updateError, setUpdateError] = useState<string | null>(null);
  const [rowToDelete, setRowToDelete] = useState<UserRow | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const userRequestController = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!canSelectCompany) {
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

        setCompanyRows(extractArray(await response.json()));
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") {
          return;
        }
        setCompanyRows([]);
      }
    };

    void loadCompanies();

    return () => controller.abort();
  }, [canSelectCompany]);

  const loadUsers = async (
    companyCode: string,
    signal?: AbortSignal,
  ): Promise<void> => {
    if (!companyCode || companyCode === "all") {
      setRowsByCompany((current) => ({ ...current, [companyCode]: [] }));
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/user/all", {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ companyCode }),
        signal,
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        throw new Error(payload?.message ?? "Unable to fetch users.");
      }

      const userRows = extractArray(await response.json()).map(
        normalizeUserRow,
      );

      setRowsByCompany((current) => ({
        ...current,
        [companyCode]: userRows,
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
          : "Unable to fetch users.",
      );
    } finally {
      if (!signal?.aborted) {
        setLoading(false);
      }
    }
  };

  useEffect(() => () => userRequestController.current?.abort(), []);

  useEffect(() => {
    if (!userCompanyCode) {
      return;
    }

    if (selectedCompany === "all") {
      return;
    }

    const controller = new AbortController();
    userRequestController.current = controller;
    void loadUsers(selectedCompany, controller.signal);
  }, [selectedCompany, userCompanyCode]);

//   const handleCompanyChange = (companyCode: string) => {
//   const normalizedCompanyCode = String(companyCode)
//     .trim()
//     .toUpperCase();

//   userRequestController.current?.abort();

//   setSelectedCompany(normalizedCompanyCode);
//   setError(null);
// };

const handleCompanyChange = (companyCode: string) => {
  userRequestController.current?.abort();

  setSelectedCompany(companyCode);
  setError(null);
};

  const refreshUsers = async () => {
    if (selectedCompany === "all") {
      return;
    }

    userRequestController.current?.abort();
    const controller = new AbortController();
    userRequestController.current = controller;
    await loadUsers(selectedCompany, controller.signal);
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

  const columns = useMemo<ManagementColumn<UserRow>[]>(() => [
    {
      id: "serialNo",
      label: "S.No.",
      render: (_row, index) => (index ?? 0) + 1,
      exportValue: (_row, index) => (index ?? 0) + 1,
    },
    {
      id: "name",
      label: "User Name",
      render: (row) => row.name,
      exportValue: (row) => row.name,
    },
    {
      id: "email",
      label: "Email",
      render: (row) => row.email,
      exportValue: (row) => row.email,
    },
    {
      id: "role",
      label: "Role",
      render: (row) => row.role,
      exportValue: (row) => row.role,
    },
    {
      id: "mobileNumber",
      label: "Mobile Number",
      render: (row) => row.mobileNumber,
      exportValue: (row) => row.mobileNumber,
    },
    {
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
    },
  ], []);

  const addRow = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setAddError(null);

    const companyCode = canSelectCompany ? selectedCompany : userCompanyCode;

    if (!companyCode || companyCode === "all") {
      setAddError("Please select a company before adding a user.");
      return;
    }

    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const name = String(form.get("name") ?? "").trim();
    const email = String(form.get("email") ?? "").trim();
    const password = String(form.get("password") ?? "").trim();
    const role = String(form.get("role") ?? "").trim();
    const mobileNumber = String(form.get("mobileNumber") ?? "").trim();
    const alternateNumber = String(form.get("alternateNumber") ?? "").trim();
    const status = String(form.get("status") ?? "ACTIVE").trim();

    if (!name || !email || !password || !role) {
      setAddError("User name, email, password, and role are required.");
      return;
    }

    try {
      setIsSaving(true);
      const response = await fetch("/api/user/add", {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          companyCode,
          displayName: name,
          email,
          password,
          roles: [role],
          mobileNumber,
          alternateNumber,
          status,
        }),
      });

      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(payload?.message ?? "Unable to add user.");
      }

      setIsAddOpen(false);
      formElement.reset();
      await refreshUsers();
    } catch (saveError) {
      setAddError(
        saveError instanceof Error
          ? saveError.message
          : "Unable to add user.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  const updateRow = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setUpdateError(null);

    const companyCode = canSelectCompany ? selectedCompany : userCompanyCode;

    if (!companyCode || companyCode === "all") {
      setUpdateError("Please select a company before updating a user.");
      return;
    }

    if (!editingRow) {
      return;
    }

    const form = new FormData(event.currentTarget);
    const name = String(form.get("name") ?? "").trim();
    const email = String(form.get("email") ?? "").trim();
    const role = String(form.get("role") ?? "").trim();
    const mobileNumber = String(form.get("mobileNumber") ?? "").trim();
    const alternateNumber = String(form.get("alternateNumber") ?? "").trim();
    const status = String(form.get("status") ?? "ACTIVE").trim();
    const remark = String(form.get("remark") ?? "").trim();

    if (!name || !email || !role) {
      setUpdateError("User name, email, and role are required.");
      return;
    }

    try {
      setIsUpdating(true);
      const response = await fetch(
        `/api/user/${encodeURIComponent(editingRow.id)}`,
        {
          method: "PUT",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            companyCode,
            displayName: name,
            email,
            roles: [role],
            mobileNumber,
            alternateNumber,
            status,
            remark: remark || null,
          }),
        },
      );

      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(payload?.message ?? "Unable to update user.");
      }

      setEditingRow(null);
      await refreshUsers();
    } catch (saveError) {
      setUpdateError(
        saveError instanceof Error
          ? saveError.message
          : "Unable to update user.",
      );
    } finally {
      setIsUpdating(false);
    }
  };

  const deleteRow = async () => {
    if (!rowToDelete || isDeleting) {
      return;
    }

    const companyCode = canSelectCompany ? selectedCompany : userCompanyCode;

    if (!companyCode || companyCode === "all") {
      setError("Please select a company before deleting a user.");
      return;
    }

    try {
      setError(null);
      setIsDeleting(true);

      const response = await fetch(
        `/api/user/${encodeURIComponent(rowToDelete.id)}`,
        {
          method: "DELETE",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ companyCode }),
        },
      );

      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(payload?.message ?? "Unable to delete user.");
      }

      setRowToDelete(null);
      await refreshUsers();
    } catch (deleteError) {
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : "Unable to delete user.",
      );
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="manage-accounts-card" style={{ marginTop: 16 }}>
      <div className="manage-accounts-policy-header-row">
        <div className="manage-accounts-policy-title-block">
          <h1 className="manage-accounts-policy-title">Users</h1>
        </div>

        <div className="manage-accounts-policy-toolbar">
          {canSelectCompany && (
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
              Add User
            </button>
          </div>
        </div>
      </div>

      <ManagementScreen
        title="Users"
        entityName="User"
        items={rows}
        columns={columns}
        loading={loading}
        error={error}
        showHeader={false}
        showSearch={true}
        onRefresh={refreshUsers}
        onAdd={() => {
          setAddError(null);
          setIsAddOpen(true);
        }}
        getRowId={(row) => row.id}
        getRowLabel={(row) => row.name}
        getSearchValues={(row) => [
          row.name,
          row.email,
          row.role,
          row.mobileNumber,
          row.status,
        ]}
        emptyMessage={
          selectedCompany === "all"
            ? "Please select a company to view users."
            : "No users found for this company."
        }
        showActions={true}
        onEdit={(row) => {
          setUpdateError(null);
          setEditingRow(row);
        }}
        onDelete={setRowToDelete}
      />

      <FormModal
        title="Add User"
        isOpen={isAddOpen}
        onClose={() => {
          setAddError(null);
          setIsAddOpen(false);
        }}
        onSubmit={addRow}
        saveLabel="Save User"
        saving={isSaving}
      >
        {addError && <div className="app-form-error">{addError}</div>}

        <label className="app-form-field">
          <span>User Name</span>
          <input name="name" required />
        </label>

        <label className="app-form-field">
          <span>Email</span>
          <input name="email" type="email" required />
        </label>

        <label className="app-form-field">
          <span>Password</span>
          <input name="password" type="password" required />
        </label>

        <label className="app-form-field">
          <span>Role</span>
          <select name="role" required>
            <option value="">Select Role</option>
            <option value="SYSTEM">System</option>
            <option value="SUPER_ADMIN">Super Admin</option>
            <option value="TMS_USER">TMS User</option>
            <option value="TMS_ADMIN">TMS Admin</option>
            <option value="HRIS_EMPLOYEE">HRIS Employee</option>
            <option value="HRIS_MANAGER">HRIS Manager</option>
            <option value="HRIS_ADMIN">HRIS Admin</option>
          </select>
        </label>

        <label className="app-form-field">
          <span>Mobile Number</span>
          <input name="mobileNumber" type="tel" />
        </label>

        <label className="app-form-field">
          <span>Alternate Number</span>
          <input name="alternateNumber" type="tel" />
        </label>

        <label className="app-form-field">
          <span>Status</span>
          <select name="status" defaultValue="ACTIVE">
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
          </select>
        </label>
      </FormModal>

      <FormModal
        title="Edit User"
        isOpen={Boolean(editingRow)}
        onClose={() => {
          if (!isUpdating) {
            setUpdateError(null);
            setEditingRow(null);
          }
        }}
        onSubmit={updateRow}
        saveLabel="Update User"
        saving={isUpdating}
      >
        {editingRow && (
          <>
            {updateError && <div className="app-form-error">{updateError}</div>}

            <label className="app-form-field">
              <span>User Name</span>
              <input name="name" defaultValue={editingRow.name} required />
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
              <span>Role</span>
              <select name="role" defaultValue={editingRow.role} required>
                <option value="">Select Role</option>
                <option value="SYSTEM">System</option>
                <option value="SUPER_ADMIN">Super Admin</option>
                <option value="TMS_USER">TMS User</option>
                <option value="TMS_ADMIN">TMS Admin</option>
                <option value="HRIS_EMPLOYEE">HRIS Employee</option>
                <option value="HRIS_MANAGER">HRIS Manager</option>
                <option value="HRIS_ADMIN">HRIS Admin</option>
              </select>
            </label>

            <label className="app-form-field">
              <span>Mobile Number</span>
              <input
                name="mobileNumber"
                type="tel"
                defaultValue={editingRow.mobileNumber}
              />
            </label>

            <label className="app-form-field">
              <span>Alternate Number</span>
              <input
                name="alternateNumber"
                type="tel"
                defaultValue={editingRow.alternateNumber}
              />
            </label>

            <label className="app-form-field">
              <span>Status</span>
              <select name="status" defaultValue={editingRow.status || "ACTIVE"}>
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
              </select>
            </label>

            <label className="app-form-field">
              <span>Remark</span>
              <textarea name="remark" rows={3} defaultValue={editingRow.remark} />
            </label>
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
          Are you sure you want to delete the user{" "}
          <strong>&quot;{rowToDelete?.name}&quot;</strong>? This cannot be
          undone.
        </p>
      </Modal>
    </div>
  );
}
