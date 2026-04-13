"use client";

import { ColumnDef, flexRender, getCoreRowModel, useReactTable } from "@tanstack/react-table";
import Link from "next/link";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { NormalizedJob } from "@/lib/types";

const columns: ColumnDef<NormalizedJob>[] = [
  {
    accessorKey: "title",
    header: "Title",
    cell: ({ row }) => (
      <div>
        <p className="font-medium">{row.original.title}</p>
        <p className="text-xs text-neutral-500">{row.original.company}</p>
      </div>
    ),
  },
  {
    accessorKey: "location",
    header: "Location",
  },
  {
    accessorKey: "salaryText",
    header: "Salary",
  },
  {
    accessorKey: "createdAtLabel",
    header: "Created",
  },
  {
    id: "apply",
    header: "Apply",
    cell: ({ row }) => (
      <Link href={row.original.redirectUrl} target="_blank" className="text-sm underline">
        Open
      </Link>
    ),
  },
];

export function JobsTable({ jobs }: { jobs: NormalizedJob[] }) {
  const table = useReactTable({
    data: jobs,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="rounded-lg border border-neutral-200 bg-white p-3">
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <TableHead key={header.id}>
                  {header.isPlaceholder
                    ? null
                    : flexRender(header.column.columnDef.header, header.getContext())}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows.map((row) => (
            <TableRow key={row.id}>
              {row.getVisibleCells().map((cell) => (
                <TableCell key={cell.id}>
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
