"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import ManagementTable, { type ManagementColumn } from "./ManagementTable";
import ManagementToolbar, {
  type ColumnVisibilityOption,
} from "./ManagementToolbar";

interface ManagementScreenProps<T> {
  title: string;
  entityName: string;
  items: T[];
  columns: ManagementColumn<T>[];
  loading: boolean;
  error: string | null;
  onRefresh: () => void | Promise<void>;
  getRowId: (item: T) => string;
  getRowLabel: (item: T) => string;
  getSearchValues: (item: T) => Array<string | null | undefined>;
  emptyMessage: string;
  showActions?: boolean;
  onFilter?: () => void;
  onExport?: () => void;
  onAdd?: () => void;
  onEdit?: (item: T) => void;
  onDelete?: (item: T) => void;
}

export default function ManagementScreen<T>({
  title,
  entityName,
  items,
  columns,
  loading,
  error,
  onRefresh,
  getRowId,
  getRowLabel,
  getSearchValues,
  emptyMessage,
  showActions,
  onFilter,
  onExport,
  onAdd,
  onEdit,
  onDelete,
}: ManagementScreenProps<T>) {
  const [search, setSearch] = useState("");
  const [visibleColumnIds, setVisibleColumnIds] = useState<Set<string>>(
    () => new Set([...columns.map((column) => column.id), ...(showActions ? ["action"] : [])])
  );

  const columnOptions = useMemo<ColumnVisibilityOption[]>(
    () => [
      ...columns.map(({ id, label }) => ({ id, label })),
      ...(showActions ? [{ id: "action", label: "Action" }] : []),
    ],
    [columns, showActions]
  );

  const visibleColumns = useMemo(
    () => columns.filter((column) => visibleColumnIds.has(column.id)),
    [columns, visibleColumnIds]
  );

  const toggleColumn = (columnId: string) => {
    setVisibleColumnIds((currentIds) => {
      const nextIds = new Set(currentIds);

      if (nextIds.has(columnId)) {
        nextIds.delete(columnId);
      } else {
        nextIds.add(columnId);
      }

      return nextIds;
    });
  };

  const resetColumns = () => {
    setVisibleColumnIds(new Set(columnOptions.map((column) => column.id)));
  };

  const filteredItems = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return items;
    }

    return items.filter((item) =>
      getSearchValues(item).some((value) =>
        (value ?? "").toLowerCase().includes(query)
      )
    );
  }, [getSearchValues, items, search]);

  const exportToCsv = () => {
    if (onExport) {
      onExport();
      return;
    }

    const escapeCsvValue = (value: string | number | null | undefined) => {
      const text = String(value ?? "");

      return `"${text.replaceAll('"', '""')}"`;
    };
    const csv = [
      visibleColumns.map((column) => escapeCsvValue(column.label)).join(","),
      ...filteredItems.map((item) =>
        visibleColumns
          .map((column) => escapeCsvValue(column.exportValue?.(item)))
          .join(",")
      ),
    ].join("\n");
    const fileName = `${entityName.toLowerCase().replaceAll(" ", "-")}s.csv`;
    const url = URL.createObjectURL(
      new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8" })
    );
    const downloadLink = document.createElement("a");

    downloadLink.href = url;
    downloadLink.download = fileName;
    downloadLink.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="module-management">
      <div className="module-management-header">
        <h1>{title}</h1>
      </div>

      <div className="module-management-toolbar">
        <div className="module-search">
          <Search size={22} />
          <input
            type="search"
            placeholder={`Search ${entityName.toLowerCase()}s`}
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>

        <ManagementToolbar
          entityName={entityName}
          onRefresh={onRefresh}
          onFilter={onFilter}
          onExport={exportToCsv}
          onAdd={onAdd}
          columnOptions={columnOptions}
          visibleColumnIds={visibleColumnIds}
          onToggleColumn={toggleColumn}
          onResetColumns={resetColumns}
        />
      </div>

      {error && <div className="module-error">{error}</div>}

      <ManagementTable
        items={filteredItems}
        columns={visibleColumns}
        getRowId={getRowId}
        getRowLabel={getRowLabel}
        loading={loading}
        emptyMessage={emptyMessage}
        showActions={showActions && visibleColumnIds.has("action")}
        onEdit={onEdit}
        onDelete={onDelete}
      />
    </div>
  );
}
