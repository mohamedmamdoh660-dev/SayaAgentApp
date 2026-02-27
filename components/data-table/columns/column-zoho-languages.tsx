"use client";

import { ColumnDef } from "@tanstack/react-table";
import { DataTableColumnHeader } from "../data-table-column-header";
import { ZohoLanguagesTableRowActions } from "../actions/zoho-languages-actions";
import { currentTimezone } from "@/lib/helper/current-timezone";
import { ZohoLanguage } from "@/types/types";

export function getZohoLanguagesColumns(
  fetchLanguages: () => void
): ColumnDef<ZohoLanguage>[] {
  const columns: ColumnDef<ZohoLanguage, unknown>[] = [
    {
      accessorKey: "name",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Language Name" />
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
    //       <ZohoLanguagesTableRowActions
    //         row={row}
    //         fetchLanguages={fetchLanguages}
    //       />
    //     </div>
    //   ),
    // },
  ];

  return columns;
}
