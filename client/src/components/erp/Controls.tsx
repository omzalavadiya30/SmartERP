"use client";
import {
  cloneElement,
  isValidElement,
  useId,
  useMemo,
  useState,
  type ReactElement,
  type ReactNode,
} from "react";
import { flexRender, getCoreRowModel, useReactTable, type ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { ArrowDownToLine, Search } from "lucide-react";
import type { Row } from "./model";
export function Action({
  children,
  onClick,
  primary = false,
  disabled = false,
  type = "button",
}: {
  children: ReactNode;
  onClick?: () => void;
  primary?: boolean;
  disabled?: boolean;
  type?: "button" | "submit";
}) {
  return (
    <Button
      type={type}
      variant={primary ? "default" : "outline"}
      className={primary ? "erp-btn primary" : "erp-btn"}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </Button>
  );
}
export function Field({ title, children }: { title: string; children: ReactNode }) {
  const id = useId();
  return (
    <div className="efield">
      <label htmlFor={id}>{title}</label>
      {isValidElement(children)
        ? cloneElement(children as ReactElement<{ id: string }>, { id })
        : children}
    </div>
  );
}
export function DataTable({
  rows,
  actions,
  empty = "No entries yet.",
  onExport,
}: {
  rows: Row[];
  actions?: (row: Row) => ReactNode;
  empty?: string;
  onExport?: () => void;
}) {
  const [search, setSearch] = useState("");
  const visible = useMemo(
    () =>
      rows.filter((r) =>
        Object.entries(r).some(
          ([k, v]) =>
            k !== "id" &&
            String(v ?? "")
              .toLowerCase()
              .includes(search.toLowerCase()),
        ),
      ),
    [rows, search],
  );
  const columns = useMemo<ColumnDef<Row>[]>(
    () =>
      Object.keys(rows[0] || {})
        .filter((k) => k !== "id")
        .map((k) => ({
          accessorKey: k,
          header: k.replaceAll("_", " "),
          cell: ({ row }) => String(row.original[k] ?? "—"),
        })),
    [rows],
  );
  const table = useReactTable({ data: visible, columns, getCoreRowModel: getCoreRowModel() });
  return (
    <div className="etable">
      <div className="table-tools">
        <label>
          <Search size={15} />
          <input
            data-filter
            aria-label="Search entries"
            placeholder="Search entries…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </label>
        {onExport && (
          <Action onClick={onExport}>
            <ArrowDownToLine size={14} /> Excel
          </Action>
        )}
      </div>
      {visible.length ? (
        <div className="scroll-table">
          <table>
            <thead>
              {table.getHeaderGroups().map((g) => (
                <tr key={g.id}>
                  {g.headers.map((h) => (
                    <th key={h.id}>{flexRender(h.column.columnDef.header, h.getContext())}</th>
                  ))}
                  {actions && <th>Actions</th>}
                </tr>
              ))}
            </thead>
            <tbody>
              {table.getRowModel().rows.map((r) => (
                <tr key={r.id} data-row-id={r.original.id}>
                  {r.getVisibleCells().map((c) => (
                    <td key={c.id}>{flexRender(c.column.columnDef.cell, c.getContext())}</td>
                  ))}
                  {actions && <td>{actions(r.original)}</td>}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="empty">{search ? "No matching entries." : empty}</p>
      )}
    </div>
  );
}
