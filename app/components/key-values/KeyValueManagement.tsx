"use client";

import { useState, type FormEvent } from "react";
import ManagementScreen from "@/app/components/system-settings/ManagementScreen";
import type { ManagementColumn } from "@/app/components/system-settings/ManagementTable";
import StatusBadge from "@/app/components/system-settings/StatusBadge";
import type { KeyValue } from "@/app/types/system-settings/keyValue";
import type { KeyValueStatus } from "@/app/types/system-settings/keyValue";
import FormModal from "@/app/components/ui/FormModal";
import Modal from "@/app/components/ui/Modal";
import { useKeyValues } from "@/app/hooks/system-settings/useKeyValues";
import { useKeyNames } from "@/app/hooks/system-settings/useKeyNames";
import { keyValueService } from "@/app/services/system-settings/keyValueService";

const keyValueColumns: ManagementColumn<KeyValue>[] = [
  {
    id: "id",
    label: "SERIAL",
    render: (_item, index) => (index ?? 0) + 1,
    exportValue: (_item, index) => (index ?? 0) + 1,
  },
  {
    id: "key",
    label: "Key Name",
    render: (item) => item.key,
    exportValue: (item) => item.key,
  },
  {
    id: "value",
    label: "Key Value",
    render: (item) => item.value,
    exportValue: (item) => item.value,
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

export default function KeyValueManagement() {
  const { keyValues, loading, error, refresh } = useKeyValues();
  const { keyNames } = useKeyNames();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingKeyValue, setEditingKeyValue] = useState<KeyValue | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [editError, setEditError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [keyValueToDelete, setKeyValueToDelete] = useState<KeyValue | null>(null);
  const [addValue, setAddValue] = useState("");
  const [editValue, setEditValue] = useState("");

  const handleAddKeyChange = (key: string) => {
    const existing = keyValues.find((kv) => kv.key === key);
    setAddValue(existing?.value ?? "");
  };

  const handleEditKeyChange = (key: string) => {
    const existing = keyValues.find((kv) => kv.key === key);
    if (existing) {
      setEditValue(existing.value);
    }
  };

  const handleSave = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaveError(null);
    setSaving(true);

    const formData = new FormData(event.currentTarget);
    const key = String(formData.get("key") ?? "").trim();
    const value = String(formData.get("value") ?? "").trim();

    if (!key || !value) {
      setSaveError("Key and Value are required.");
      setSaving(false);
      return;
    }

    try {
      await keyValueService.addKeyValue({
        key,
        value,
      });
      setIsAddModalOpen(false);
      setAddValue("");
      await refresh();
    } catch (error) {
      setSaveError(
        error instanceof Error ? error.message : "Failed to add key value."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (keyValue: KeyValue) => {
    if (isDeleting) {
      return;
    }

    try {
      setIsDeleting(true);
      setDeleteError(null);
      await keyValueService.deleteKeyValue(String(keyValue.id));
      setKeyValueToDelete(null);
      await refresh();
    } catch (error) {
      setDeleteError(
        error instanceof Error ? error.message : "Unable to delete the key value."
      );
    } finally {
      setIsDeleting(false);
    }
  };

  const handleEditSave = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!editingKeyValue) {
      return;
    }

    const formData = new FormData(event.currentTarget);
    const key = String(formData.get("key") ?? "").trim();
    const value = String(formData.get("value") ?? "").trim();
    const remark = String(formData.get("remark") ?? "").trim();
    const status = String(formData.get("status") ?? "") as KeyValueStatus;

    if (!key || !value) {
      setEditError("Key and Value are required.");
      return;
    }

    try {
      setSaving(true);
      setEditError(null);
      await keyValueService.updateKeyValue(String(editingKeyValue.id), {
        key,
        value,
        remark,
        status,
      });
      setEditingKeyValue(null);
      await refresh();
    } catch (error) {
      setEditError(
        error instanceof Error ? error.message : "Failed to update key value."
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      {deleteError && <div className="module-error">{deleteError}</div>}

      <ManagementScreen
      title="Key Value Management"
      entityName="Key Value"
      items={keyValues}
      columns={keyValueColumns}
      loading={loading}
      error={error}
      onRefresh={refresh}
      getRowId={(item) => String(item.id)}
      getRowLabel={(item) => item.key}
      getSearchValues={(item) => [
        String(item.id),
        item.key,
        item.value,
        item.remark,
        item.status,
      ]}
      emptyMessage="No key values found."
      showActions
      onEdit={(keyValue) => {
        setEditError(null);
        setEditValue(keyValue.value);
        setEditingKeyValue(keyValue);
      }}
      onDelete={(keyValue) => {
        setDeleteError(null);
        setKeyValueToDelete(keyValue);
      }}
      onAdd={() => {
        setSaveError(null);
        setAddValue("");
        setIsAddModalOpen(true);
      }}
      />

      <FormModal
      title="Add Key Value"
      isOpen={isAddModalOpen}
      onClose={() => setIsAddModalOpen(false)}
      onSubmit={handleSave}
      saveLabel="Save Key Value"
      saving={saving}
      >
      {saveError && (
        <div className="app-form-error">{saveError}</div>
      )}

      <label className="app-form-field">
        <span>Key</span>
        <select
          name="key"
          required
          onChange={(event) => handleAddKeyChange(event.target.value)}
        >
          <option value="">Select a key name</option>
          {keyNames.map((keyName) => (
            <option key={keyName.id} value={keyName.name}>
              {keyName.name}
            </option>
          ))}
        </select>
      </label>

      <label className="app-form-field">
        <span>Value</span>
        <input
          name="value"
          value={addValue}
          onChange={(event) => setAddValue(event.target.value)}
          required
        />
      </label>
      </FormModal>

      <FormModal
      title="Edit Key Value"
      isOpen={Boolean(editingKeyValue)}
      onClose={() => setEditingKeyValue(null)}
      onSubmit={handleEditSave}
      saveLabel="Update Key Value"
      saving={saving}
      >
      {editingKeyValue && (
        <>
          {editError && (
            <div className="app-form-error">{editError}</div>
          )}
          <label className="app-form-field">
            <span>Key</span>
            <select
              name="key"
              defaultValue={editingKeyValue.key}
              required
              onChange={(event) => handleEditKeyChange(event.target.value)}
            >
              <option value="">Select a key name</option>
              {keyNames.map((keyName) => (
                <option key={keyName.id} value={keyName.name}>
                  {keyName.name}
                </option>
              ))}
            </select>
          </label>

          <label className="app-form-field">
            <span>Value</span>
            <input
              name="value"
              value={editValue}
              onChange={(event) => setEditValue(event.target.value)}
              required
            />
          </label>

          <label className="app-form-field">
            <span>Remark</span>
            <textarea name="remark" rows={3} defaultValue={editingKeyValue.remark ?? ""} />
          </label>

          <label className="app-form-field">
            <span>Status</span>
            <select name="status" defaultValue={editingKeyValue.status}>
              <option value="ACTIVE">ACTIVE</option>
              <option value="INACTIVE">INACTIVE</option>
            </select>
          </label>
        </>
      )}
      </FormModal>

      <Modal
        title="Confirm Delete"
        isOpen={Boolean(keyValueToDelete)}
        onClose={() => setKeyValueToDelete(null)}
        footer={
          <>
            <button
              type="button"
              className="app-modal-cancel"
              onClick={() => setKeyValueToDelete(null)}
              disabled={isDeleting}
            >
              Cancel
            </button>
            <button
              type="button"
              className="app-modal-save"
              onClick={() => keyValueToDelete && handleDelete(keyValueToDelete)}
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </button>
          </>
        }
      >
        <p>
          Are you sure you want to delete the key value{" "}
          <strong>"{keyValueToDelete?.key}"</strong>? This cannot be
          undone.
        </p>
      </Modal>
    </>
  );
}
