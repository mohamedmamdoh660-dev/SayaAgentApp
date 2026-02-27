"use client";

import { ColumnDef } from "@tanstack/react-table";
import { DataTableColumnHeader } from "../data-table-column-header";
import { ZohoFacultyTableRowActions } from "../actions/zoho-faculty-actions";
import { currentTimezone } from "@/lib/helper/current-timezone";
import { ZohoFaculty } from "@/types/types";
import { StatusBadge } from "@/components/ui/status-badge";

export function getZohoFacultyColumns(
  fetchFaculties: () => void
): ColumnDef<ZohoFaculty>[] {
  const columns: ColumnDef<ZohoFaculty, unknown>[] = [
    {
      accessorKey: "name",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Faculty Name" />
      ),
      cell: ({ row }) => {
        return (
          <div className="text-left font-medium">
            {row.original.name || "-"}
          </div>
        );
      },
      enableSorting: true,
      enableHiding: true,
    },

    {
      accessorKey: "active",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Status" />
      ),
      cell: ({ row }) => {
        return row.original.active ? (
          <StatusBadge status="active" />
        ) : (
          <StatusBadge status="inactive" />
        );
      },
      enableSorting: true,
      enableHiding: true,
    },

    {
      accessorKey: "created_at",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Created" />
      ),
      cell: ({ row }) => {
        const created = row.original.created_at;
        return (
          <div className="text-left overflow-hidden whitespace-nowrap">
            {currentTimezone(created)}
          </div>
        );
      },
      enableSorting: true,
      enableHiding: true,
    },

    // {
    //   id: "actions",
    //   header: ({ column }) => (
    //     <DataTableColumnHeader column={column} title="Actions" />
    //   ),
    //   cell: ({ row }) => (
    //     <div className="text-center">
    //       <ZohoFacultyTableRowActions
    //         row={row}
    //         fetchFaculties={fetchFaculties}
    //       />
    //     </div>
    //   ),
    // },
  ];

  return columns;
}
