"use client";

import { useState, type FormEvent } from "react";
import { useModules } from "@/app/hooks/system-settings/useModules";
import { moduleService } from "@/app/services/system-settings/moduleService";
import type { ManagementColumn } from "@/app/components/system-settings/ManagementTable";
import ManagementScreen from "@/app/components/system-settings/ManagementScreen";
import StatusBadge from "@/app/components/system-settings/StatusBadge";
import FormModal from "@/app/components/ui/FormModal";
import Modal from "@/app/components/ui/Modal";
import type { Module } from "@/app/types/system-settings/module";

const moduleColumns: ManagementColumn<Module>[] = [
  {
    id: "id",
    label: "S.NO.",
    render: (_module, index) => (index ?? 0) + 1,
    exportValue: (_module, index) => (index ?? 0) + 1,
  },
  {
    id: "name",
    label: "Module Name",
    render: (module) => module.name,
    exportValue: (module) => module.name,
  },
  {
    id: "code",
    label: "Module Code",
    render: (module) => module.code,
    exportValue: (module) => module.code,
  },
  {
    id: "remark",
    label: "Remark",
    render: (module) => module.remark ?? "-",
    exportValue: (module) => module.remark ?? "-",
  },
  {
    id: "status",
    label: "Status",
    render: (module) => <StatusBadge status={module.status} />,
    exportValue: (module) => module.status,
  },
];

export default function ModuleManagement() {
  const { modules, loading, error, refresh } = useModules();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [editingModule, setEditingModule] = useState<Module | null>(null);
  const [editError, setEditError] = useState<string | null>(null);
  const [moduleToDelete, setModuleToDelete] = useState<Module | null>(null);

  const closeAddModal = () => {
    if (!isSaving) {
      setSaveError(null);
      setIsAddModalOpen(false);
    }
  };

  const handleSave = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    try {
      setIsSaving(true);
      setSaveError(null);
      await moduleService.addModule({
        code: String(formData.get("code") ?? ""),
        name: String(formData.get("name") ?? ""),
      });
      await refresh();
      setIsAddModalOpen(false);
    } catch (error) {
      setSaveError(
        error instanceof Error ? error.message : "Unable to add the module."
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (module: Module) => {
    if (isDeleting) {
      return;
    }

    try {
      setIsDeleting(true);
      setDeleteError(null);
      await moduleService.deleteModule(module.id);
      setModuleToDelete(null);
      await refresh();
    } catch (error) {
      setDeleteError(
        error instanceof Error ? error.message : "Unable to delete the module."
      );
    } finally {
      setIsDeleting(false);
    }
  };

  const closeEditModal = () => {
    if (!isSaving) {
      setEditError(null);
      setEditingModule(null);
    }
  };

  const handleEditSave = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    if (!editingModule) {
      return;
    }

    try {
      setIsSaving(true);
      setEditError(null);
      await moduleService.updateModule(editingModule.id, {
        code: String(formData.get("code") ?? ""),
        name: String(formData.get("name") ?? ""),
        remark: String(formData.get("remark") ?? ""),
        status: String(formData.get("status") ?? "") as Module["status"],
      });
      await refresh();
      setEditingModule(null);
    } catch (error) {
      setEditError(
        error instanceof Error ? error.message : "Unable to update the module."
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      {deleteError && <div className="module-error">{deleteError}</div>}

      <ManagementScreen
      title="Module Management"
      entityName="Module"
      items={modules}
      columns={moduleColumns}
      loading={loading}
      error={error}
      onRefresh={refresh}
      getRowId={(module) => module.id}
      getRowLabel={(module) => module.name}
      getSearchValues={(module) => [
        module.name,
        module.code,
        module.remark,
        module.status,
      ]}
      emptyMessage="No modules found."
      showActions
      onEdit={(module) => {
        setEditError(null);
        setEditingModule(module);
      }}
      onDelete={(module) => {
        setDeleteError(null);
        setModuleToDelete(module);
      }}
      onAdd={() => {
        setSaveError(null);
        setIsAddModalOpen(true);
      }}
      />

      <FormModal
      title="Add Module"
      isOpen={isAddModalOpen}
      onClose={closeAddModal}
      onSubmit={handleSave}
      saveLabel="Save Module"
      saving={isSaving}
      >
      {saveError && <p className="app-form-error">{saveError}</p>}

      <label className="app-form-field">
        <span>Module Code</span>
        <input name="code" required />
      </label>

      <label className="app-form-field">
        <span>Module Name</span>
        <input name="name" required />
      </label>

      </FormModal>

      <FormModal
      title="Edit Module"
      isOpen={Boolean(editingModule)}
      onClose={closeEditModal}
      onSubmit={handleEditSave}
      saveLabel="Update Module"
      saving={isSaving}
      >
      {editingModule && (
        <>
          {editError && <p className="app-form-error">{editError}</p>}

          <label className="app-form-field">
            <span>Module Code</span>
            <input name="code" defaultValue={editingModule.code} disabled={true} required />
          </label>

          <label className="app-form-field">
            <span>Module Name</span>
            <input name="name" defaultValue={editingModule.name} required />
          </label>

          <label className="app-form-field">
            <span>Remark</span>
            <textarea name="remark" rows={3} defaultValue={editingModule.remark ?? ""} />
          </label>

          <label className="app-form-field">
            <span>Status</span>
            <select name="status" defaultValue={editingModule.status}>
              <option value="ACTIVE">ACTIVE</option>
              <option value="INACTIVE">INACTIVE</option>
            </select>
          </label>
        </>
      )}
      </FormModal>

      <Modal
        title="Confirm Delete"
        isOpen={Boolean(moduleToDelete)}
        onClose={() => setModuleToDelete(null)}
        footer={
          <>
            <button
              type="button"
              className="app-modal-cancel"
              onClick={() => setModuleToDelete(null)}
              disabled={isDeleting}
            >
              Cancel
            </button>
            <button
              type="button"
              className="app-modal-save"
              onClick={() => moduleToDelete && handleDelete(moduleToDelete)}
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </button>
          </>
        }
      >
        <p>
          Are you sure you want to delete the module{" "}
          <strong>"{moduleToDelete?.name}"</strong>? This cannot be
          undone.
        </p>
      </Modal>
    </>
  );
}