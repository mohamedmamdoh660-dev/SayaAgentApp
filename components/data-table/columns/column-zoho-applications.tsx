"use client";

import { ColumnDef } from "@tanstack/react-table";
import { DataTableColumnHeader } from "../data-table-column-header";
import { currentTimezone } from "@/lib/helper/current-timezone";
import { ZohoApplication } from "@/types/types";
import Image from "next/image";
import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { generateNameAvatar } from "@/utils/generateRandomAvatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DownloadIcon, Info, Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  conditionalButtonDisabled,
  finalAcceptanceButtonDisabled,
} from "@/components/(main)/zoho-applications/component/stages-conditions";
import { downloadAttachment } from "@/utils/download-attachment";
import { StatusBadge } from "@/components/ui/status-badge";

export function getZohoApplicationsColumns(
  fetchApplications: () => void,
  router: any,
  applicationDownloading: { id: string; name: string },
  setApplicationDownloading: (applicationDownloading: {
    id: string;
    name: string;
  }) => void
): ColumnDef<ZohoApplication>[] {
  const columns: ColumnDef<ZohoApplication, unknown>[] = [
    {
      accessorKey: "application_name",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Application" />
      ),
      cell: ({ row }) => {
        const applicationName = row.original.application_name;
        const student = row.original.zoho_students;
        const fullName =
          `${student?.first_name || ""} ${student?.last_name || ""}`.trim();

        return (
          <div className="flex items-center w-full">
            <Avatar className="border-foreground/10 border-[1px]">
              <AvatarImage
                src={student?.photo_url || generateNameAvatar(fullName)}
              />
            </Avatar>
            <div className="grid flex-1 text-left text-sm leading-tight ml-3">
              <span
                className="font-semibold cursor-pointer hover:text-primary"
                onClick={() => router.push(`/applications/${row.original.id}`)}
              >
                {applicationName}
              </span>
              <span className="text-xs text-muted-foreground ">
                {fullName || "-"}
              </span>
            </div>
          </div>
        );
      },
      enableSorting: true,
      enableHiding: true,
    },

    {
      accessorKey: "program",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Program" />
      ),
      cell: ({ row }) => {
        const program = row.original.zoho_programs;

        return (
          <div
            className="max-w-[400px] leading-tight cursor-pointer line-clamp-2 text-wrap w-[300px] hover:underline hover:text-primary"
            title={program?.name || "-"}
            onClick={() => router.push(`/programs/${row.original.program}`)}
          >
            {program?.name ||
              (row.original.program ? `ID: ${row.original.program}` : "-")}
          </div>
        );
      },
      enableSorting: false,
      enableHiding: true,
    },

    {
      accessorKey: "university",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="University" />
      ),
      cell: ({ row }) => {
        const university = row.original.zoho_universities;
        if (!university) return "-";

        return (
          <div className="flex items-center gap-2">
            <Avatar className="border-foreground/10 border-[1px]">
              <AvatarImage
                src={
                  university?.logo?.includes("http")
                    ? university.logo
                    : generateNameAvatar(university?.name || "")
                }
              />
            </Avatar>
            <div
              className="text-left hover:cursor-pointer hover:text-primary"
              onClick={() => router.push(`/universities/${university?.id}`)}
            >
              {university?.name ||
                (row.original.university
                  ? `ID: ${row.original.university}`
                  : "-")}
            </div>
          </div>
        );
      },
      enableSorting: false,
      enableHiding: true,
    },

    {
      accessorKey: "degree",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Degree" />
      ),
      cell: ({ row }) => {
        return (
          <div className="text-left">
            {row.original.zoho_degrees?.name ||
              (row.original.degree ? `ID: ${row.original.degree}` : "-")}
          </div>
        );
      },
      enableSorting: false,
      enableHiding: true,
    },

    {
      accessorKey: "academic",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Academic Year/Semester" />
      ),
      cell: ({ row }) => {
        const academicYear = row.original.zoho_academic_years?.name;
        const semester = row.original.zoho_semesters?.name;

        return (
          <div className="text-left">
            {academicYear || "-"} / {semester || "-"}
          </div>
        );
      },
      enableSorting: false,
      enableHiding: true,
    },

    {
      accessorKey: "country",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Country" />
      ),
      cell: ({ row }) => {
        return (
          <div className="text-left">
            {row.original.zoho_countries?.name ||
              (row.original.country ? `ID: ${row.original.country}` : "-")}
          </div>
        );
      },
      enableSorting: false,
      enableHiding: true,
    },

    {
      accessorKey: "stage",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Stage" />
      ),
      cell: ({ row }) => {
        const stage = row.original.stage || "";

        return (
          <div className="text-[12px]">
            <StatusBadge status={stage} />
          </div>
        );
      },
      enableSorting: true,
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

        if (!agent) return "-";

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
      accessorKey: "download_conditional",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Download Conditional" />
      ),
      cell: ({ row }) => {
        const disabled = conditionalButtonDisabled(
          row?.original?.stage?.toLowerCase() || ""
        );

        return (
          <div className="text-left overflow-hidden whitespace-nowrap">
            <Button
              variant="outline"
              size="sm"
              disabled={
                disabled ||
                (applicationDownloading.id === row.original.id &&
                  applicationDownloading.name === "conditional")
              }
              onClick={async (e) => {
                setApplicationDownloading({
                  id: row.original.id,
                  name: "conditional",
                });
                await downloadAttachment(row.original.id, "conditional");
                setApplicationDownloading({ id: "", name: "" });
              }}
            >
              {applicationDownloading.id === row.original.id &&
              applicationDownloading.name === "conditional" ? (
                <Loader2 className="mr-1 h-4 w-4 animate-spin" />
              ) : (
                <DownloadIcon className="mr-1 h-4 w-4" />
              )}
              Download Conditional
            </Button>
          </div>
        );
      },
      enableSorting: false,
      enableHiding: true,
    },

    {
      accessorKey: "final_acceptance",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Final Acceptance" />
      ),
      cell: ({ row }) => {
        const disabled = finalAcceptanceButtonDisabled(
          row?.original?.stage?.toLowerCase() || ""
        );

        return (
          <div className="text-left overflow-hidden whitespace-nowrap">
            <Button
              variant="outline"
              size="sm"
              disabled={
                disabled ||
                (applicationDownloading.id === row.original.id &&
                  applicationDownloading.name === "final")
              }
              onClick={async (e) => {
                setApplicationDownloading({
                  id: row.original.id,
                  name: "final",
                });
                await downloadAttachment(row.original.id, "final");
                setApplicationDownloading({ id: "", name: "" });
              }}
            >
              {applicationDownloading.id === row.original.id &&
              applicationDownloading.name === "final" ? (
                <Loader2 className="mr-1 h-4 w-4 animate-spin" />
              ) : (
                <DownloadIcon className="mr-1 h-4 w-4" />
              )}
              Download Final Acceptance
            </Button>
          </div>
        );
      },
      enableSorting: false,
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
                onClick={() => router.push(`/applications/${row.original.id}`)}
              />
            </TooltipTrigger>
            <TooltipContent>
              <p>View Details</p>
            </TooltipContent>
          </Tooltip>
          {/* <ZohoApplicationsTableRowActions
            row={row}
            fetchApplications={fetchApplications}
          /> */}
        </div>
      ),
    },
  ];

  return columns;
}
