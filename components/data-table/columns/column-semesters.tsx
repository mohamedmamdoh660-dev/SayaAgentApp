"use client";

import { ColumnDef } from "@tanstack/react-table";
import { ZohoSemester } from "@/types/types";
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";
import { SemestersActions } from "../actions/semesters-actions";
import { StatusBadge } from "@/components/ui/status-badge";
import { currentTimezone } from "@/lib/helper/current-timezone";

export const columnsSemesters: ColumnDef<ZohoSemester>[] = [
  {
    accessorKey: "name",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Name" />
    ),
    cell: ({ row }) => {
      return (
        <div className="flex space-x-2">
          <span className="max-w-[500px] truncate font-medium">
            {row.getValue("name")}
          </span>
        </div>
      );
    },
  },
  {
    accessorKey: "active",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Status" />
    ),
    cell: ({ row }) => {
      const isActive = row.getValue("active");

      return (
        <div className="flex w-[100px] items-center">
          {isActive ? (
            <StatusBadge status="active" />
          ) : (
            <StatusBadge status="inactive" />
          )}
        </div>
      );
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id));
    },
  },
  {
    accessorKey: "created_at",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Created At" />
    ),
    cell: ({ row }) => {
      const created_at = row.getValue("created_at") as string;
      if (!created_at) return null;

      return (
        <div className="flex items-center">{currentTimezone(created_at)}</div>
      );
    },
  },
  // {
  //   id: "actions",
  //   cell: ({ row }) => {
  //     const semester = row.original;

  //     return <SemestersActions semester={semester} />;
  //   },
  // },
];
