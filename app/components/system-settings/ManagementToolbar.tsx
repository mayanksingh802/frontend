"use client";

import { useEffect, useRef, useState } from "react";
import { Download, Filter, Plus, RefreshCw } from "lucide-react";

export interface ColumnVisibilityOption {
  id: string;
  label: string;
}

interface ManagementToolbarProps {
  entityName: string;
  onRefresh: () => void | Promise<void>;
  onFilter?: () => void;
  onExport?: () => void;
  onAdd?: () => void;
  columnOptions?: ColumnVisibilityOption[];
  visibleColumnIds?: ReadonlySet<string>;
  onToggleColumn?: (columnId: string) => void;
  onResetColumns?: () => void;
}

export default function ManagementToolbar({
  entityName,
  onRefresh,
  onFilter,
  onExport,
  onAdd,
  columnOptions,
  visibleColumnIds,
  onToggleColumn,
  onResetColumns,
}: ManagementToolbarProps) {
  const [isColumnPickerOpen, setIsColumnPickerOpen] = useState(false);
  const columnPickerRef = useRef<HTMLDivElement>(null);
  const hiddenColumnCount = columnOptions
    ? columnOptions.filter((column) => !visibleColumnIds?.has(column.id)).length
    : 0;

  useEffect(() => {
    if (!isColumnPickerOpen) {
      return;
    }

    const closePicker = (event: MouseEvent) => {
      if (
        columnPickerRef.current &&
        !columnPickerRef.current.contains(event.target as Node)
      ) {
        setIsColumnPickerOpen(false);
      }
    };

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsColumnPickerOpen(false);
      }
    };

    document.addEventListener("mousedown", closePicker);
    document.addEventListener("keydown", closeOnEscape);

    return () => {
      document.removeEventListener("mousedown", closePicker);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [isColumnPickerOpen]);

  return (
    <div className="module-toolbar-actions">
      {columnOptions ? (
        <div ref={columnPickerRef} className="module-column-picker">
          <button
            className={`module-toolbar-button ${
              isColumnPickerOpen ? "active" : ""
            }`}
            type="button"
            title="Show columns"
            onClick={() => setIsColumnPickerOpen((isOpen) => !isOpen)}
            aria-expanded={isColumnPickerOpen}
            aria-haspopup="menu"
          >
            <Filter size={20} />
          </button>

          {hiddenColumnCount > 0 && (
            <span
              className="module-column-picker-count"
              aria-label={`${hiddenColumnCount} hidden columns`}
            >
              {hiddenColumnCount}
            </span>
          )}

          {isColumnPickerOpen && (
            <div className="module-column-picker-menu" role="menu">
              <div className="module-column-picker-header">
                <span>Show columns</span>
                <button type="button" onClick={onResetColumns}>
                  Reset
                </button>
              </div>

              <div className="module-column-picker-options">
                {columnOptions.map((column) => (
                  <label key={column.id} className="module-column-picker-option">
                    <input
                      type="checkbox"
                      checked={visibleColumnIds?.has(column.id) ?? true}
                      onChange={() => onToggleColumn?.(column.id)}
                    />
                    <span>{column.label}</span>
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <button
          className="module-toolbar-button"
          type="button"
          title="Filter"
          onClick={onFilter}
          disabled={!onFilter}
        >
          <Filter size={20} />
        </button>
      )}

      <button
        className="module-toolbar-button"
        type="button"
        title="Export"
        onClick={onExport}
        disabled={!onExport}
      >
        <Download size={20} />
      </button>

      <button
        className="module-toolbar-button"
        type="button"
        title="Refresh"
        onClick={() => void onRefresh()}
      >
        <RefreshCw size={20} />
      </button>

      <button
        className="module-add-button"
        type="button"
        onClick={onAdd}
        disabled={!onAdd}
      >
        <Plus size={21} />
        Add {entityName}
      </button>
    </div>
  );
}
