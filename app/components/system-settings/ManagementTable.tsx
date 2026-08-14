"use client";

import { useState, type ReactNode } from "react";
import { MoreVertical, Pencil, Trash2 } from "lucide-react";

export interface ManagementColumn<T> {
  id: string;
  label: string;
  render: (item: T, index?: number) => ReactNode;
  exportValue?: (item: T, index?: number) => string | number | null | undefined;
}

interface ManagementTableProps<T> {
  items: T[];
  columns: ManagementColumn<T>[];
  getRowId: (item: T) => string;
  getRowLabel: (item: T) => string;
  loading: boolean;
  emptyMessage: string;
  showActions?: boolean;
  onEdit?: (item: T) => void;
  onDelete?: (item: T) => void;
}

export default function ManagementTable<T>({
  items,
  columns,
  getRowId,
  getRowLabel,
  loading,
  emptyMessage,
  showActions = false,
  onEdit,
  onDelete,
}: ManagementTableProps<T>) {
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const hasActions = showActions || Boolean(onEdit || onDelete);

  if (loading) {
    return <div className="module-table-loading">Loading data...</div>;
  }

  return (
    <div className="module-table-wrapper">
      <table className="module-table">
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column.id}>{column.label}</th>
            ))}
            {hasActions && (
              <th className="module-table-action-column">Action</th>
            )}
          </tr>
        </thead>

        <tbody>
          {items.map((item, index) => {
            const rowId = getRowId(item);
            const isMenuOpen = openMenuId === rowId;

            return (
              <tr key={rowId}>
                {columns.map((column) => (
                  <td key={column.id}>{column.render(item, index)}</td>
                ))}

                {hasActions && (
                  <td className="module-table-action-column">
                    <div className="module-action">
                      <button
                        type="button"
                        className={`module-action-button ${
                          isMenuOpen ? "active" : ""
                        }`}
                        onClick={() => setOpenMenuId(isMenuOpen ? null : rowId)}
                        aria-label={`Actions for ${getRowLabel(item)}`}
                        aria-expanded={isMenuOpen}
                      >
                        <MoreVertical size={18} />
                      </button>

                      {isMenuOpen && (
                        <div className="module-action-menu">
                          <button
                            type="button"
                            className="module-action-menu-item"
                            onClick={() => {
                              onEdit?.(item);
                              setOpenMenuId(null);
                            }}
                          >
                            <Pencil size={18} />
                            <span>Edit</span>
                          </button>

                          <button
                            type="button"
                            className="module-action-menu-item delete"
                            onClick={() => {
                              onDelete?.(item);
                              setOpenMenuId(null);
                            }}
                          >
                            <Trash2 size={18} />
                            <span>Delete</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </td>
                )}
              </tr>
            );
          })}

          {!items.length && (
            <tr>
              <td
                className="module-table-empty"
                colSpan={columns.length + (hasActions ? 1 : 0)}
              >
                {emptyMessage}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
