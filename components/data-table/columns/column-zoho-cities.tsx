"use client";

import { ColumnDef } from "@tanstack/react-table";
import { DataTableColumnHeader } from "../data-table-column-header";
import { ZohoCitiesTableRowActions } from "../actions/zoho-cities-actions";
import { currentTimezone } from "@/lib/helper/current-timezone";
import { ZohoCity } from "@/types/types";

export function getZohoCitiesColumns(
  fetchCities: () => void
): ColumnDef<ZohoCity>[] {
  const columns: ColumnDef<ZohoCity, unknown>[] = [
    {
      accessorKey: "name",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="City Name" />
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
      accessorKey: "country",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Country" />
      ),
      cell: ({ row }) => {
        return (
          <div className="text-left">
            {row.original.zoho_countries?.name || "-"}
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

    // {
    //   id: "actions",
    //   header: ({ column }) => (
    //     <DataTableColumnHeader column={column} title="Actions" />
    //   ),
    //   cell: ({ row }) => (
    //     <div className="text-center">
    //       <ZohoCitiesTableRowActions row={row} fetchCities={fetchCities} />
    //     </div>
    //   ),
    // },
  ];

  return columns;
}
