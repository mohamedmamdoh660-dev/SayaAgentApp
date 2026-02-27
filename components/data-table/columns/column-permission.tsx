"use client";

import { ColumnDef, Row } from "@tanstack/react-table";
import { DataTableColumnHeader } from "../data-table-column-header";
import { currentTimezone } from "@/lib/helper/current-timezone";
import { RoleAccess } from "@/types/types";
import { Badge } from "@/components/ui/badge";
import { PermissionTableRowActions } from "../actions/permission-actions";

export function getPermissionColumns(
  fetchPermissions: () => void
): ColumnDef<RoleAccess>[] {
  const columns: ColumnDef<RoleAccess, unknown>[] = [
    {
      accessorKey: "role",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Role" />
      ),
      cell: ({ row }) => {
        return (
          <div className="flex items-center w-full">
            <div className="grid flex-1 text-left text-sm leading-tight">
              <span className="font-semibold capitalize">
                {row.original.roles.name || ""}
              </span>
            </div>
          </div>
        );
      },
      enableSorting: true,
      enableHiding: true,
    },
    {
      accessorKey: "resource",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Resource" />
      ),
      cell: ({ row }) => {
        return (
          <div className="flex items-center w-full">
            <div className="grid flex-1 text-left text-sm leading-tight">
              <Badge variant="outline" className="w-fit">
                {row.original.resource || ""}
              </Badge>
            </div>
          </div>
        );
      },
      enableSorting: true,
      enableHiding: true,
    },
    {
      accessorKey: "action",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Action" />
      ),
      cell: ({ row }) => {
        return (
          <div className="flex items-center w-full">
            <div className="grid flex-1 text-left text-sm leading-tight">
              <Badge variant="default" className="w-fit">
                {row.original.action || ""}
              </Badge>
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
    {
      id: "actions",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Actions" />
      ),
      cell: ({ row }) => (
        <div className="text-center">
          <PermissionTableRowActions
            row={row as unknown as Row<RoleAccess>}
            fetchPermissions={fetchPermissions}
          />
        </div>
      ),
    },
  ];

  return columns;
}
