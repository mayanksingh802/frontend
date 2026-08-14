"use client";

import { useState, type FormEvent } from "react";
import ManagementScreen from "@/app/components/system-settings/ManagementScreen";
import type { ManagementColumn } from "@/app/components/system-settings/ManagementTable";
import StatusBadge from "@/app/components/system-settings/StatusBadge";
import type { KeyName } from "@/app/types/system-settings/keyName";
import FormModal from "@/app/components/ui/FormModal";
import Modal from "@/app/components/ui/Modal";
import { useKeyNames } from "@/app/hooks/system-settings/useKeyNames";
import { keyNameService } from "@/app/services/system-settings/keyNameService";
import type { KeyNameStatus } from "@/app/types/system-settings/keyName";

const keyNameColumns: ManagementColumn<KeyName>[] = [
  {
    id: "id",
    label: "SERIAL",
    render: (_item, index) => (index ?? 0) + 1,
    exportValue: (_item, index) => (index ?? 0) + 1,
  },
  {
    id: "name",
    label: "Key Name",
    render: (item) => item.name,
    exportValue: (item) => item.name,
  },
  {
    id: "remark",
    label: "Remark",
    render: (item) => item.remark ?? "-",
    exportValue: (item) => item.remark ?? "-",
  },
  {
    id: "status",
    label: "Status",
    render: (item) => <StatusBadge status={item.status} />,
    exportValue: (item) => item.status,
  },
];

export default function KeyNameManagement() {
  const { keyNames, loading, error, refresh } = useKeyNames();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingKeyName, setEditingKeyName] = useState<KeyName | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [editError, setEditError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [keyNameToDelete, setKeyNameToDelete] = useState<KeyName | null>(null);

  const handleSave = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaveError(null);
    setSaving(true);

    const formData = new FormData(event.currentTarget);
    const name = String(formData.get("keyName") ?? "").trim();

    if (!name) {
      setSaveError("Key Name is required.");
      setSaving(false);
      return;
    }

    try {
      await keyNameService.addKeyName({
        name,
      });
      setIsAddModalOpen(false);
      await refresh();
    } catch (error) {
      setSaveError(
        error instanceof Error ? error.message : "Failed to add key name."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (keyName: KeyName) => {
    if (isDeleting) {
      return;
    }

    try {
      setIsDeleting(true);
      setDeleteError(null);
      await keyNameService.deleteKeyName(String(keyName.id));
      setKeyNameToDelete(null);
      await refresh();
    } catch (error) {
      setDeleteError(
        error instanceof Error ? error.message : "Unable to delete the key name."
      );
    } finally {
      setIsDeleting(false);
    }
  };

  const handleEditSave = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!editingKeyName) {
      return;
    }

    const formData = new FormData(event.currentTarget);
    const name = String(formData.get("name") ?? "").trim();
    const remark = String(formData.get("remark") ?? "").trim();
    const status = String(formData.get("status") ?? "") as KeyNameStatus;

    if (!name) {
      setEditError("Key Name is required.");
      return;
    }

    try {
      setSaving(true);
      setEditError(null);
      await keyNameService.updateKeyName(String(editingKeyName.id), {
        name,
        remark,
        status,
      });
      setEditingKeyName(null);
      await refresh();
    } catch (error) {
      setEditError(
        error instanceof Error ? error.message : "Failed to update key name."
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      {deleteError && <div className="module-error">{deleteError}</div>}

      <ManagementScreen
      title="Key Name Management"
      entityName="Key Name"
      items={keyNames}
      columns={keyNameColumns}
      loading={loading}
      error={error}
      onRefresh={refresh}
      getRowId={(item) => String(item.id)}
      getRowLabel={(item) => item.name}
      getSearchValues={(item) => [
        String(item.id),
        item.name,
        item.remark,
        item.status,
      ]}
      emptyMessage="No key names found."
      showActions
      onEdit={(keyName) => {
        setEditError(null);
        setEditingKeyName(keyName);
      }}
      onDelete={(keyName) => {
        setDeleteError(null);
        setKeyNameToDelete(keyName);
      }}
      onAdd={() => {
        setSaveError(null);
        setIsAddModalOpen(true);
      }}
      />

      <FormModal
      title="Add Key Name"
      isOpen={isAddModalOpen}
      onClose={() => setIsAddModalOpen(false)}
      onSubmit={handleSave}
      saveLabel="Save Key Name"
      saving={saving}
      >
      {saveError && (
        <div className="app-form-error">{saveError}</div>
      )}

      <label className="app-form-field">
        <span>Key Name</span>
        <input name="keyName" required />
      </label>
      </FormModal>

      <FormModal
      title="Edit Key Name"
      isOpen={Boolean(editingKeyName)}
      onClose={() => setEditingKeyName(null)}
      onSubmit={handleEditSave}
      saveLabel="Update Key Name"
      saving={saving}
      >
      {editingKeyName && (
        <>
          {editError && (
            <div className="app-form-error">{editError}</div>
          )}

          <label className="app-form-field">
            <span>Key Name</span>
            <input name="name" defaultValue={editingKeyName.name} required />
          </label>

          <label className="app-form-field">
            <span>Remark</span>
            <textarea name="remark" rows={3} defaultValue={editingKeyName.remark ?? ""} />
          </label>

          <label className="app-form-field">
            <span>Status</span>
            <select name="status" defaultValue={editingKeyName.status}>
              <option value="ACTIVE">ACTIVE</option>
              <option value="INACTIVE">INACTIVE</option>
            </select>
          </label>
        </>
      )}
      </FormModal>

      <Modal
        title="Confirm Delete"
        isOpen={Boolean(keyNameToDelete)}
        onClose={() => setKeyNameToDelete(null)}
        footer={
          <>
            <button
              type="button"
              className="app-modal-cancel"
              onClick={() => setKeyNameToDelete(null)}
              disabled={isDeleting}
            >
              Cancel
            </button>
            <button
              type="button"
              className="app-modal-save"
              onClick={() => keyNameToDelete && handleDelete(keyNameToDelete)}
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </button>
          </>
        }
      >
        <p>
          Are you sure you want to delete the key name{" "}
          <strong>"{keyNameToDelete?.name}"</strong>? This cannot be
          undone.
        </p>
      </Modal>
    </>
  );
}
