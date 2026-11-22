"use client";

import {
  createColumnHelper,
  rowSelectionFeature,
  rowSortingFeature,
  tableFeatures,
  useTable,
  type RowSelectionState,
  type SortingState,
} from "@tanstack/react-table";
import { ArrowDown, ArrowUp, ArrowUpDown, MapPin } from "lucide-react";
import { motion } from "motion/react";
import type { Employee, EmployeeSortField } from "@/lib/api/types";
import { Avatar } from "@/components/ui/primitives";
import { cn, formatDate, fullName } from "@/lib/utils";
import { StatusBadge } from "./status-badge";

// Features and columns live at module scope so they're stable between renders (a v9 requirement).
const features = tableFeatures({ rowSortingFeature, rowSelectionFeature });
const helper = createColumnHelper<typeof features, Employee>();

const Checkbox = ({ checked, indeterminate, onChange, label }: { checked: boolean; indeterminate?: boolean; onChange: () => void; label: string }) => (
  <input
    type="checkbox"
    aria-label={label}
    checked={checked}
    ref={(el) => {
      if (el) el.indeterminate = Boolean(indeterminate);
    }}
    onChange={onChange}
    onClick={(e) => e.stopPropagation()}
    className="size-4 cursor-pointer rounded accent-[var(--primary)]"
  />
);

const columns = helper.columns([
  helper.display({
    id: "select",
    header: ({ table }) => (
      <Checkbox
        label="Select all on this page"
        checked={table.getIsAllPageRowsSelected()}
        indeterminate={table.getIsSomePageRowsSelected()}
        onChange={() => table.toggleAllPageRowsSelected()}
      />
    ),
    cell: ({ row }) => <Checkbox label={`Select ${fullName(row.original)}`} checked={row.getIsSelected()} onChange={() => row.toggleSelected()} />,
    enableSorting: false,
  }),
  helper.accessor((e) => `${e.lastName} ${e.firstName}`, {
    id: "name",
    header: "Name",
    cell: ({ row }) => (
      <div className="flex items-center gap-3">
        <Avatar person={row.original} />
        <div className="min-w-0">
          <p className="truncate font-medium">{fullName(row.original)}</p>
          <p className="truncate text-xs text-muted-foreground">{row.original.email}</p>
        </div>
      </div>
    ),
  }),
  helper.accessor("jobTitle", { header: "Role" }),
  helper.accessor("department", { header: "Department" }),
  helper.accessor("location", {
    header: "Location",
    cell: (info) => (
      <span className="inline-flex items-center gap-1.5 text-muted-foreground">
        <MapPin className="size-3.5" />
        {info.getValue()}
      </span>
    ),
  }),
  helper.accessor("startDate", { header: "Start date", cell: (info) => <span className="tabular-nums">{formatDate(info.getValue())}</span> }),
  helper.accessor("status", { header: "Status", cell: (info) => <StatusBadge status={info.getValue()} /> }),
]);

export function EmployeesTable({
  rows,
  sort,
  dir,
  onSortChange,
  selection,
  onSelectionChange,
  onOpen,
  busy,
}: {
  rows: Employee[];
  sort: EmployeeSortField;
  dir: "asc" | "desc";
  onSortChange: (sort: EmployeeSortField, dir: "asc" | "desc") => void;
  selection: RowSelectionState;
  onSelectionChange: (s: RowSelectionState) => void;
  onOpen: (id: string) => void;
  busy: boolean;
}) {
  const sorting: SortingState = [{ id: sort, desc: dir === "desc" }];

  const table = useTable({
    features,
    columns,
    data: rows,
    getRowId: (e) => e.id,
    state: { sorting, rowSelection: selection },
    // Sorting happens on the server: Table only tracks state and calls us back.
    manualSorting: true,
    enableSortingRemoval: false,
    onSortingChange: (updater) => {
      const next = typeof updater === "function" ? updater(sorting) : updater;
      if (next[0]) onSortChange(next[0].id as EmployeeSortField, next[0].desc ? "desc" : "asc");
    },
    onRowSelectionChange: (updater) => onSelectionChange(typeof updater === "function" ? updater(selection) : updater),
  });

  return (
    <div className="overflow-x-auto">
      <table className={cn("w-full min-w-[860px] text-left text-sm transition-opacity", busy && "opacity-60")}>
        <thead>
          {table.getHeaderGroups().map((group) => (
            <tr key={group.id} className="border-b text-xs text-muted-foreground">
              {group.headers.map((header) => {
                const canSort = header.column.getCanSort();
                const sorted = header.column.getIsSorted();
                return (
                  <th
                    key={header.id}
                    scope="col"
                    aria-sort={sorted ? (sorted === "asc" ? "ascending" : "descending") : canSort ? "none" : undefined}
                    className={cn("px-4 py-3 font-medium", header.column.id === "select" && "w-10")}
                  >
                    {canSort ? (
                      <button type="button" onClick={header.column.getToggleSortingHandler()} className="-ml-1 inline-flex items-center gap-1.5 rounded px-1 hover:text-foreground">
                        <table.FlexRender header={header} />
                        {sorted === "asc" ? <ArrowUp className="size-3.5" /> : sorted === "desc" ? <ArrowDown className="size-3.5" /> : <ArrowUpDown className="size-3.5 opacity-40" />}
                      </button>
                    ) : (
                      <table.FlexRender header={header} />
                    )}
                  </th>
                );
              })}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.map((row, i) => (
            <motion.tr
              key={row.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: i * 0.02 }}
              onClick={() => onOpen(row.id)}
              className={cn("cursor-pointer border-b last:border-0 transition-colors hover:bg-muted/50", row.getIsSelected() && "bg-accent/40")}
            >
              {row.getAllCells().map((cell) => (
                <td key={cell.id} className="px-4 py-3">
                  {cell.column.id === "name" ? (
                    // Real link-like button for keyboard and screen-reader users; the row click is a mouse shortcut.
                    <button type="button" className="text-left focus-visible:outline-offset-4" onClick={(e) => { e.stopPropagation(); onOpen(row.id); }}>
                      <table.FlexRender cell={cell} />
                    </button>
                  ) : (
                    <table.FlexRender cell={cell} />
                  )}
                </td>
              ))}
            </motion.tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
