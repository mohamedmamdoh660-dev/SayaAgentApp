"use client";

import { ColumnDef } from "@tanstack/react-table";
import { ZohoCountry } from "@/types/types";
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";
import { CountriesActions } from "../actions/countries-actions";
import { StatusBadge } from "@/components/ui/status-badge";
import { currentTimezone } from "@/lib/helper/current-timezone";

export const columnsCountries: ColumnDef<ZohoCountry>[] = [
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
    accessorKey: "country_code",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Country Code" />
    ),
    cell: ({ row }) => {
      return (
        <div className="flex space-x-2">
          <span className="font-medium">
            {row.getValue("country_code") || "N/A"}
          </span>
        </div>
      );
    },
  },
  {
    accessorKey: "active_on_nationalities",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Active for Nationalities" />
    ),
    cell: ({ row }) => {
      const isActive = row.getValue("active_on_nationalities");

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
    accessorKey: "active_on_university",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Active for Universities" />
    ),
    cell: ({ row }) => {
      const isActive = row.getValue("active_on_university");

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
  //     const country = row.original;

  //     return <CountriesActions country={country} />;
  //   },
  // },
];
