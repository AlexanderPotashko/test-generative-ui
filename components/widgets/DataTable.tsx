"use client";

import { useEffect, useState, useMemo } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  flexRender,
  createColumnHelper,
  type SortingState,
} from "@tanstack/react-table";
import { ChevronUp, ChevronDown, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/cn";
import type { DataTableProps } from "@/types/page-config";

export function DataTable({ title, dataSource, columns, timeRange, category, status, pageSize = 10 }: DataTableProps & { timeRange?: string; category?: string; status?: string }) {
  const [rawData, setRawData] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);
  const [sorting, setSorting] = useState<SortingState>([]);

  useEffect(() => {
    const params = new URLSearchParams({ limit: "200" });
    if (timeRange) params.set("timeRange", timeRange);
    if (category) params.set("category", category);
    if (status) params.set("status", status);

    fetch(`/api/data/${dataSource}?${params}`)
      .then((r) => r.json())
      .then(setRawData)
      .finally(() => setLoading(false));
  }, [dataSource, timeRange, category, status]);

  const columnHelper = createColumnHelper<Record<string, unknown>>();

  const tableCols = useMemo(
    () =>
      columns.map((col) =>
        columnHelper.accessor(col, {
          header: col.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()),
          cell: (info) => {
            const v = info.getValue();
            if (col === "amount" || col === "price") {
              return `$${Number(v).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
            }
            return String(v ?? "—");
          },
        })
      ),
    [columns]
  );

  const table = useReactTable({
    data: rawData,
    columns: tableCols,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize } },
  });

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-5 flex flex-col gap-4 h-full">
      <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">{title}</p>
      {loading ? (
        <div className="flex-1 bg-zinc-100 dark:bg-zinc-800 rounded animate-pulse" />
      ) : (
        <>
          <div className="overflow-auto rounded-lg border border-zinc-100 dark:border-zinc-800">
            <table className="w-full text-sm">
              <thead className="bg-zinc-50 dark:bg-zinc-800">
                {table.getHeaderGroups().map((hg) => (
                  <tr key={hg.id}>
                    {hg.headers.map((header) => (
                      <th
                        key={header.id}
                        className="px-3 py-2 text-left text-xs font-medium text-zinc-500 uppercase tracking-wide cursor-pointer select-none whitespace-nowrap"
                        onClick={header.column.getToggleSortingHandler()}
                      >
                        <span className="flex items-center gap-1">
                          {flexRender(header.column.columnDef.header, header.getContext())}
                          {header.column.getIsSorted() === "asc" ? (
                            <ChevronUp className="w-3 h-3" />
                          ) : header.column.getIsSorted() === "desc" ? (
                            <ChevronDown className="w-3 h-3" />
                          ) : (
                            <ChevronsUpDown className="w-3 h-3 opacity-30" />
                          )}
                        </span>
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>
              <tbody>
                {table.getRowModel().rows.map((row, i) => (
                  <tr
                    key={row.id}
                    className={cn(
                      "border-t border-zinc-100 dark:border-zinc-800",
                      i % 2 === 0 ? "bg-white dark:bg-zinc-900" : "bg-zinc-50/50 dark:bg-zinc-800/30"
                    )}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className="px-3 py-2 text-zinc-700 dark:text-zinc-300 whitespace-nowrap">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between text-xs text-zinc-500">
            <span>
              {rawData.length} rows total
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
                className="px-2 py-1 rounded border border-zinc-200 dark:border-zinc-700 disabled:opacity-40 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              >
                ‹
              </button>
              <span className="px-2">
                {table.getState().pagination.pageIndex + 1} / {table.getPageCount()}
              </span>
              <button
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
                className="px-2 py-1 rounded border border-zinc-200 dark:border-zinc-700 disabled:opacity-40 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              >
                ›
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
