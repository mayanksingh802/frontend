"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import ManagementScreen from "@/app/components/system-settings/ManagementScreen";
import type { ManagementColumn } from "@/app/components/system-settings/ManagementTable";
import FilterHeaderRow from "@/app/components/ui/FilterHeaderRow";
import FormModal from "@/app/components/ui/FormModal";
import Modal from "@/app/components/ui/Modal";

export type OrganizationStructureEntity =
  | "business-unit"
  | "branch"
  | "designation";

type StructureRow = {
  id: string;
  name: string;
  code: string;
  manager: string;
  status: string;
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
  const [addError, setAddError] = useState<string | null>(null);
  const [editingRow, setEditingRow] = useState<StructureRow | null>(null);
  const [updateError, setUpdateError] = useState<string | null>(null);
  const [rowToDelete, setRowToDelete] = useState<StructureRow | null>(null);

  useEffect(() => {
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

  const rows = selectedCompany === "all" ? [] : rowsByCompany[selectedCompany] ?? [];

  const columns = useMemo<ManagementColumn<StructureRow>[]>(
    () => [
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
      {
        id: "manager",
        label: "Manager",
        render: (row) => row.manager,
        exportValue: (row) => row.manager,
      },
      {
        id: "status",
        label: "Status",
        render: (row) => row.status,
        exportValue: (row) => row.status,
      },
    ],
    [],
  );

  const addRow = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setAddError(null);

    if (selectedCompany === "all") {
      setAddError(`Please select a company before adding a ${config.singular.toLowerCase()}.`);
      return;
    }

    const form = new FormData(event.currentTarget);
    const name = String(form.get("name") ?? "").trim();
    const code = String(form.get("code") ?? "").trim();

    if (!name) {
      setAddError(`${config.singular} name is required.`);
      return;
    }

    const row: StructureRow = {
      id: crypto.randomUUID(),
      name,
      code,
      manager: "",
      status: "Active",
    };

    setRowsByCompany((current) => ({
      ...current,
      [selectedCompany]: [...(current[selectedCompany] ?? []), row],
    }));
    setIsAddOpen(false);
    event.currentTarget.reset();
  };

  const updateRow = (event: FormEvent<HTMLFormElement>) => {
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

    if (!name) {
      setUpdateError(`${config.singular} name is required.`);
      return;
    }

    setRowsByCompany((current) => ({
      ...current,
      [selectedCompany]: (current[selectedCompany] ?? []).map((row) =>
        row.id === editingRow.id ? { ...row, name, code } : row,
      ),
    }));
    setEditingRow(null);
  };

  const deleteRow = () => {
    if (!rowToDelete || selectedCompany === "all") {
      return;
    }

    setRowsByCompany((current) => ({
      ...current,
      [selectedCompany]: (current[selectedCompany] ?? []).filter(
        (row) => row.id !== rowToDelete.id,
      ),
    }));
    setRowToDelete(null);
  };

  return (
    <div className="manage-accounts-card" style={{ marginTop: 16 }}>
      <div className="manage-accounts-policy-header-row">
        <div className="manage-accounts-policy-title-block">
          <h1 className="manage-accounts-policy-title">{config.plural}</h1>
        </div>

        <div className="manage-accounts-policy-toolbar">
          <FilterHeaderRow
            title=""
            value={selectedCompany}
            options={companyOptions}
            onChange={setSelectedCompany}
            searchPlaceholder="Search company or org"
            emptyMessage="No company/org found."
          />
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
        loading={false}
        error={null}
        showHeader={false}
        showSearch={true}
        onRefresh={() => undefined}
        onAdd={() => {
          setAddError(null);
          setIsAddOpen(true);
        }}
        getRowId={(row) => row.id}
        getRowLabel={(row) => row.name}
        getSearchValues={(row) => [
          row.name,
          row.code,
          row.manager,
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
      >
        {addError && <div className="app-form-error">{addError}</div>}

        <label className="app-form-field">
          <span>Name</span>
          <input name="name" required />
        </label>

        <label className="app-form-field">
          <span>Code</span>
          <input name="code" />
        </label>
      </FormModal>

      <FormModal
        title={`Edit ${config.singular}`}
        isOpen={Boolean(editingRow)}
        onClose={() => {
          setUpdateError(null);
          setEditingRow(null);
        }}
        onSubmit={updateRow}
        saveLabel={`Update ${config.singular}`}
      >
        {editingRow && (
          <>
            {updateError && (
              <div className="app-form-error">{updateError}</div>
            )}

            <label className="app-form-field">
              <span>Name</span>
              <input name="name" defaultValue={editingRow.name} required />
            </label>

            <label className="app-form-field">
              <span>Code</span>
              <input name="code" defaultValue={editingRow.code} />
            </label>
          </>
        )}
      </FormModal>

      <Modal
        title="Confirm Delete"
        isOpen={Boolean(rowToDelete)}
        onClose={() => setRowToDelete(null)}
        footer={
          <>
            <button
              type="button"
              className="app-modal-cancel"
              onClick={() => setRowToDelete(null)}
            >
              Cancel
            </button>
            <button
              type="button"
              className="app-modal-save"
              onClick={deleteRow}
            >
              Delete
            </button>
          </>
        }
      >
        <p>
          Are you sure you want to delete the {config.singular.toLowerCase()}{" "}
          <strong>&quot;{rowToDelete?.name}&quot;</strong>? This cannot be undone.
        </p>
      </Modal>
    </div>
  );
}