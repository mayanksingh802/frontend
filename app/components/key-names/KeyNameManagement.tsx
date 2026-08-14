"use client";

import { useState, type FormEvent } from "react";
import ManagementScreen from "@/app/components/system-settings/ManagementScreen";
import type { ManagementColumn } from "@/app/components/system-settings/ManagementTable";
import StatusBadge from "@/app/components/system-settings/StatusBadge";
import type { KeyName } from "@/app/types/system-settings/keyName";
import FormModal from "@/app/components/ui/FormModal";
import { useKeyNames } from "@/app/hooks/system-settings/useKeyNames";

const keyNameColumns: ManagementColumn<KeyName>[] = [
  {
    id: "id",
    label: "ID",
    render: (item) => item.id,
    exportValue: (item) => item.id,
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

  const handleSave = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    // Replace with the Key Name POST API, then refresh data and close the modal.
    setIsAddModalOpen(false);
  };

  const handleEditSave = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    // Connect the Key Name update API here when it is available.
    setEditingKeyName(null);
  };

  return (
    <>
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
      onEdit={setEditingKeyName}
      onAdd={() => setIsAddModalOpen(true)}
      />

      <FormModal
      title="Add Key Name"
      isOpen={isAddModalOpen}
      onClose={() => setIsAddModalOpen(false)}
      onSubmit={handleSave}
      saveLabel="Save Key Name"
      >
      <label className="app-form-field">
        <span>Key Name</span>
        <input name="keyName" required />
      </label>

      <label className="app-form-field">
        <span>Remark</span>
        <textarea name="remark" rows={3} />
      </label>
      </FormModal>

      <FormModal
      title="Edit Key Name"
      isOpen={Boolean(editingKeyName)}
      onClose={() => setEditingKeyName(null)}
      onSubmit={handleEditSave}
      saveLabel="Update Key Name"
      >
      {editingKeyName && (
        <>
          <label className="app-form-field">
            <span>ID</span>
            <input name="id" defaultValue={editingKeyName.id} readOnly />
          </label>

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
    </>
  );
}
