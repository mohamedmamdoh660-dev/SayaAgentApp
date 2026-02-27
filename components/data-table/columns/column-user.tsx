"use client";

import { Column, ColumnDef, Row } from "@tanstack/react-table";
import { DataTableColumnHeader } from "../data-table-column-header";
import { UserTableRowActions } from "../actions/user-actions";
import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

import { User } from "@/types/types";
import { Role } from "@/types/types";
import { generateNameAvatar } from "@/utils/generateRandomAvatar";
import { StatusBadge } from "@/components/ui/status-badge";
import { currentTimezone } from "@/lib/helper/current-timezone";

export function getUserColumns(
  fetchUsers: () => void,
  listRoles: Role[],
  isAdmin: boolean
): ColumnDef<User>[] {
  const columns: ColumnDef<User, unknown>[] = [
    {
      accessorKey: "first_name",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Name" />
      ),
      cell: ({ row }) => {
        const fullname =
          `${row.original.first_name || ""} ${row.original.last_name || ""}`.trim();

        return (
          <div className="flex items-center w-full">
            <Avatar className="border-foreground/10 border-[1px]">
              <AvatarImage
                className=""
                src={
                  row.original.profile?.includes("http")
                    ? row.original.profile
                    : generateNameAvatar(fullname)
                }
                alt={fullname || ""}
              />
            </Avatar>
            <div className="grid flex-1 text-left text-sm leading-tight ml-3">
              <span className="truncate font-semibold">{fullname || ""}</span>
              <span className="truncate text-xs">
                {row.original.email || ""}
              </span>
            </div>
          </div>
        );
      },
      enableSorting: true,
      enableHiding: true,
    },

    {
      accessorKey: "role",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Role" />
      ),
      cell: ({ row }) => {
        const role = row.original.roles?.name;
        return (
          <div className="text-ellipsis text-left overflow-hidden whitespace-nowrap">
            <Badge className="text-xs font-semibold ">
              {role?.toUpperCase()}
            </Badge>
          </div>
        );
      },
      enableSorting: false,
      enableHiding: true,
    },

    {
      accessorKey: "is_active",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Status" />
      ),
      cell: ({ row }) => {
        return row.original.is_active ? (
          <StatusBadge status={"active"} />
        ) : (
          <StatusBadge status={"inactive"} />
        );
      },
      enableSorting: true,
      enableHiding: true,
    },
    ...(isAdmin
      ? [
          {
            accessorKey: "agent",
            header: ({ column }: { column: Column<User> }) => (
              <DataTableColumnHeader column={column} title="Agent" />
            ),
            cell: ({ row }: { row: Row<User> }) => {
              const agent =
                row.original.agency?.settings?.edges[0]?.node.site_name ||
                row.original.settings?.edges[0]?.node.site_name;

              return agent ? (
                <div>
                  {" "}
                  <div className="flex items-center w-full">
                    <Avatar className="border-foreground/10 border-[1px]">
                      <AvatarImage
                        className=""
                        src={
                          row.original.agency?.settings?.edges[0]?.node
                            .logo_url ||
                          row.original.settings?.edges[0]?.node.logo_url
                            ? row.original.agency?.settings?.edges[0]?.node
                                .logo_url ||
                              row.original.settings?.edges[0]?.node.logo_url
                            : generateNameAvatar(agent || "")
                        }
                        alt={agent || ""}
                      />
                    </Avatar>
                    <div className="grid flex-1 text-left text-sm leading-tight ml-3">
                      <span className="truncate font-semibold">
                        {agent || ""}
                      </span>
                    </div>
                  </div>
                </div>
              ) : null;
            },
            enableSorting: false,
            enableHiding: true,
          },
        ]
      : []),

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
    {
      id: "actions",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Actions" />
      ),
      cell: ({ row }) => (
        <div className="text-center">
          <UserTableRowActions
            row={row as unknown as Row<User>}
            fetchUsers={fetchUsers}
            listRoles={listRoles as Role[]}
          />
        </div>
      ),
    },
  ];

  return columns;
}
