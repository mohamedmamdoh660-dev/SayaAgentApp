"use client";

import { ColumnDef, Row } from "@tanstack/react-table";
import { DataTableColumnHeader } from "../data-table-column-header";
import { RoleTableRowActions } from "../actions/role-actions";
import { currentTimezone } from "@/lib/helper/current-timezone";
import { Role } from "@/types/types";

export function getRoleColumns(fetchRoles: () => void): ColumnDef<Role>[] {
  const columns: ColumnDef<Role, unknown>[] = [
    {
      accessorKey: "name",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Name" />
      ),
      cell: ({ row }) => {
        return (
          <div className="flex items-center w-full">
            <div className="grid flex-1 text-left text-sm leading-tight">
              <span className="font-semibold capitalize">
                {row.original.name || ""}
              </span>
            </div>
          </div>
        );
      },
      enableSorting: true,
      enableHiding: true,
    },
    {
      accessorKey: "description",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Description" />
      ),
      cell: ({ row }) => {
        return (
          <div className="flex items-center whitespace-pre-wrap">
            <div className="grid flex-1 text-left text-sm leading-tight">
              <span className="">{row.original.description || ""}</span>
            </div>
          </div>
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
            {created
              ? currentTimezone(created)?.toLocaleString()?.replace("GMT", "")
              : "-"}
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
    //       <RoleTableRowActions
    //         row={row as unknown as Row<Role>}
    //         fetchRoles={fetchRoles}
    //       />
    //     </div>
    //   ),
    // },
  ];

  return columns;
}
