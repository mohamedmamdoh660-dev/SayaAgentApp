"use client";

import { ColumnDef } from "@tanstack/react-table";
import { ZohoUniversity } from "@/types/types";
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";
import { UniversitiesActions } from "../actions/universities-actions";
import { Globe, Info } from "lucide-react";
import { currentTimezone } from "@/lib/helper/current-timezone";
import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { generateNameAvatar } from "@/utils/generateRandomAvatar";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function getUniversitiesColumns(
  router: any
): ColumnDef<ZohoUniversity>[] {
  const columns: ColumnDef<ZohoUniversity, unknown>[] = [
    {
      accessorKey: "name",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Name" />
      ),
      cell: ({ row }) => {
        return (
          <div className="flex items-center w-full">
            <Avatar className="border-foreground/10 border-[1px]">
              <AvatarImage
                src={
                  row.original.logo ||
                  generateNameAvatar(row.original.name || "")
                }
              />
            </Avatar>
            <div className="grid flex-1 text-left text-sm leading-tight ml-3">
              <span
                className="truncate font-semibold cursor-pointer hover:text-primary"
                onClick={() => router.push(`/universities/${row.original.id}`)}
              >
                {row.original.name || ""}
              </span>
              <span className="truncate text-xs">
                {row.original.sector || ""}
              </span>
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "zoho_countries",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Country" />
      ),
      cell: ({ row }) => {
        const country = row.original.zoho_countries;
        return (
          <div className="flex items-center">
            {country ? country.name : "N/A"}
          </div>
        );
      },
      enableSorting: false,
      enableHiding: true,
    },
    {
      accessorKey: "zoho_cities",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="City" />
      ),
      cell: ({ row }) => {
        const city = row.original.zoho_cities;
        return (
          <div className="flex items-center">{city ? city.name : "N/A"}</div>
        );
      },
      enableSorting: false,
      enableHiding: true,
    },
    {
      accessorKey: "active",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Status" />
      ),
      cell: ({ row }) => {
        const active = row.original.active;
        return (
          <div className="flex items-center">
            {active ? (
              <StatusBadge status="active" />
            ) : (
              <StatusBadge status="inactive" />
            )}
          </div>
        );
      },
      enableSorting: true,
      enableHiding: true,
    },
    {
      accessorKey: "phone",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Phone" />
      ),
      cell: ({ row }) => {
        return (
          <div className="flex items-center">
            {row.getValue("phone") || "N/A"}
          </div>
        );
      },
    },
    {
      accessorKey: "website",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Website" />
      ),
      cell: ({ row }) => {
        const website = row.getValue("wesbite") as string | undefined;
        return (
          <div className="flex items-center">
            {website ? (
              <a
                href={
                  website.startsWith("http") ? website : `https://${website}`
                }
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center text-blue-500 hover:underline"
              >
                <Globe className="h-4 w-4 mr-1" />
                Visit
              </a>
            ) : (
              "N/A"
            )}
          </div>
        );
      },
      enableSorting: false,
      enableHiding: true,
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

    {
      id: "actions",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Actions" />
      ),
      cell: ({ row }) => (
        <div className="flex items-center justify-center">
          <Tooltip>
            <TooltipTrigger asChild>
              <Info
                className="!h-6 !w-6 hover:cursor-pointer hover:text-primary"
                onClick={() => router.push(`/universities/${row.original.id}`)}
              />
            </TooltipTrigger>
            <TooltipContent>
              <p>View Details</p>
            </TooltipContent>
          </Tooltip>
        </div>
      ),
    },
  ];

  return columns;
}
