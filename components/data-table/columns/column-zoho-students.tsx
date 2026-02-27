"use client";

import { ColumnDef } from "@tanstack/react-table";
import { DataTableColumnHeader } from "../data-table-column-header";
import { ZohoStudentsTableRowActions } from "../actions/zoho-students-actions";
import { currentTimezone } from "@/lib/helper/current-timezone";
import { ZohoStudent } from "@/types/types";
import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { generateNameAvatar } from "@/utils/generateRandomAvatar";
import { Info } from "lucide-react";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";

export function getZohoStudentsColumns(
  fetchStudents: () => void,
  router: any
): ColumnDef<ZohoStudent>[] {
  const columns: ColumnDef<ZohoStudent, unknown>[] = [
    {
      accessorKey: "first_name",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Student Name" />
      ),
      cell: ({ row }) => {
        const fullName =
          `${row.original.first_name || ""} ${row.original.last_name || ""}`.trim();

        return (
          <div className="flex items-center w-full">
            <Avatar className="border-foreground/10 border-[1px]">
              <AvatarImage
                src={row.original.photo_url || generateNameAvatar(fullName)}
              />
            </Avatar>
            <div className="grid flex-1 text-left text-sm leading-tight ml-3">
              <span
                className=" font-semibold cursor-pointer hover:text-primary"
                onClick={() => router.push(`/students/${row.original.id}`)}
              >
                {fullName || "-"}
              </span>
              <span className=" text-xs text-muted-foreground">
                {row.original.email || "-"}
              </span>
            </div>
          </div>
        );
      },
      enableSorting: true,
      enableHiding: true,
    },

    {
      accessorKey: "gender",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Gender" />
      ),
      cell: ({ row }) => {
        return <div className="text-left">{row.original.gender || "-"}</div>;
      },
      enableSorting: true,
      enableHiding: true,
    },

    {
      accessorKey: "date_of_birth",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Date of Birth" />
      ),
      cell: ({ row }) => {
        return (
          <div className="text-left">{row.original.date_of_birth || "-"}</div>
        );
      },
      enableSorting: true,
      enableHiding: true,
    },

    {
      accessorKey: "nationality",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Nationality" />
      ),
      cell: ({ row }) => {
        return (
          <div className="text-left">
            {row.original.nationality_record?.name || "-"}
          </div>
        );
      },
      enableSorting: false,
      enableHiding: true,
    },

    {
      accessorKey: "passport",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Passport" />
      ),
      cell: ({ row }) => {
        return (
          <div className="text-left">
            <div>{row.original.passport_number || "-"}</div>
            {row.original.passport_expiry_date && (
              <div className="text-xs text-muted-foreground">
                {" "}
                Expires: {row.original.passport_expiry_date}
              </div>
            )}
          </div>
        );
      },
      enableSorting: false,
      enableHiding: true,
    },

    {
      accessorKey: "mobile",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Contact" />
      ),
      cell: ({ row }) => {
        return <div className="text-left">{row.original.mobile || "-"}</div>;
      },
      enableSorting: true,
      enableHiding: true,
    },

    {
      accessorKey: "parents",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Parents" />
      ),
      cell: ({ row }) => {
        return (
          <div className="text-left">
            {row.original.father_name && (
              <div className="text-xs">
                <span className=" font-semibold">Father:</span>{" "}
                {row.original.father_name}
              </div>
            )}
            {row.original.mother_name && (
              <div className="text-xs">
                <span className=" font-semibold">Mother:</span>{" "}
                {row.original.mother_name}
              </div>
            )}
          </div>
        );
      },
      enableSorting: false,
      enableHiding: true,
    },
    {
      accessorKey: "agent",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Agent" />
      ),
      cell: ({ row }) => {
        const agent = row.original.agent;
        const fullName =
          `${agent?.first_name || ""} ${agent?.last_name || ""}`.trim();

        return (
          <div className="flex items-center w-full">
            <Avatar className="border-foreground/10 border-[1px]">
              <AvatarImage
                src={
                  agent?.profile?.includes("http")
                    ? agent.profile
                    : generateNameAvatar(fullName)
                }
              />
            </Avatar>
            <div className="grid flex-1 text-left text-sm leading-tight ml-3">
              <span className=" font-semibold">{fullName}</span>
              <span className=" text-xs text-muted-foreground">
                {agent?.email || "-"}
              </span>
            </div>
          </div>
        );
      },
      enableSorting: false,
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
                onClick={() => router.push(`/students/${row.original.id}`)}
              />
            </TooltipTrigger>
            <TooltipContent>
              <p>View Details</p>
            </TooltipContent>
          </Tooltip>
          {/* <ZohoStudentsTableRowActions
            row={row}
            fetchStudents={fetchStudents}
          /> */}
        </div>
      ),
    },
  ];

  return columns;
}
