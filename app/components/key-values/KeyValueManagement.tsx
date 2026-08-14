"use client";

import { useState, type FormEvent } from "react";
import ManagementScreen from "@/app/components/system-settings/ManagementScreen";
import type { ManagementColumn } from "@/app/components/system-settings/ManagementTable";
import StatusBadge from "@/app/components/system-settings/StatusBadge";
import type { KeyValue } from "@/app/types/system-settings/keyValue";
import FormModal from "@/app/components/ui/FormModal";
import { useKeyValues } from "@/app/hooks/system-settings/useKeyValues";

const keyValueColumns: ManagementColumn<KeyValue>[] = [
  {
    id: "id",
    label: "ID",
    render: (item) => item.id,
    exportValue: (item) => item.id,
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
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingKeyValue, setEditingKeyValue] = useState<KeyValue | null>(null);

  const handleSave = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    // Replace with the Key Value POST API, then refresh data and close the modal.
    setIsAddModalOpen(false);
  };

  const handleEditSave = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    // Connect the Key Value update API here when it is available.
    setEditingKeyValue(null);
  };

  return (
    <>
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
      onEdit={setEditingKeyValue}
      onAdd={() => setIsAddModalOpen(true)}
      />

      <FormModal
      title="Add Key Value"
      isOpen={isAddModalOpen}
      onClose={() => setIsAddModalOpen(false)}
      onSubmit={handleSave}
      saveLabel="Save Key Value"
      >
      <label className="app-form-field">
        <span>Key</span>
        <input name="key" placeholder="Bank" required />
      </label>

      <label className="app-form-field">
        <span>Value</span>
        <input name="value" required />
      </label>
      </FormModal>

      <FormModal
      title="Edit Key Value"
      isOpen={Boolean(editingKeyValue)}
      onClose={() => setEditingKeyValue(null)}
      onSubmit={handleEditSave}
      saveLabel="Update Key Value"
      >
      {editingKeyValue && (
        <>
          <label className="app-form-field">
            <span>ID</span>
            <input name="id" defaultValue={editingKeyValue.id} readOnly />
          </label>

          <label className="app-form-field">
            <span>Key</span>
            <input name="key" defaultValue={editingKeyValue.key} required />
          </label>

          <label className="app-form-field">
            <span>Value</span>
            <input name="value" defaultValue={editingKeyValue.value} required />
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
    </>
  );
}
