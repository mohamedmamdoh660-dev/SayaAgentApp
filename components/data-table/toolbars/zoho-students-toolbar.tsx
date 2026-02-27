"use client";

import type { Table } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { DataTableViewOptions } from "@/components/data-table/data-table-view-options";
import {
  Download,
  Plus,
  RefreshCcw,
  X,
  Search,
  Table as TableIcon,
  LayoutGrid,
} from "lucide-react";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { canCreate } from "@/lib/permissions";
import { ResourceType } from "@/types/types";

interface DataTableToolbarProps<TData> {
  table?: Table<TData>;
  onRefresh?: () => void;
  onExport?: () => void;
  tableName?: string;
  onGlobalFilterChange?: (value: string) => void;
  fetchRecords: () => void;
  type?: string;
  viewMode?: "table" | "cards";
  setViewMode?: (viewMode: "table" | "cards") => void;
}

export function ZohoStudentsDataTableToolbar<TData>({
  table,
  onRefresh,
  onExport,
  tableName,
  onGlobalFilterChange,
  fetchRecords,
  type,
  viewMode,
  setViewMode,
}: DataTableToolbarProps<TData>) {
  const router = useRouter();
  const [globalFilter, setGlobalFilter] = useState<string>("");

  const handleFilterChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setGlobalFilter(value);
    onGlobalFilterChange?.(value);
  };
  const { userProfile } = useAuth();
  const isCrmId = userProfile?.crm_id || userProfile?.agency?.crm_id;

  const isFiltered = globalFilter !== "";

  return (
    <div className="flex items-center justify-between">
      <div className="flex flex-1 items-center space-x-2">
        <div className="relative w-1/2">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by Name or Email"
            value={globalFilter}
            onChange={handleFilterChange}
            className="h-8 pl-8 w-full focus-visible:ring-0"
          />
        </div>
        {isFiltered && (
          <Button
            variant="ghost"
            onClick={() => {
              onGlobalFilterChange?.("");
              setGlobalFilter("");
            }}
            className="h-8 px-2 lg:px-3"
          >
            Reset
            <X className="ml-2 h-4 w-4" />
          </Button>
        )}
      </div>
      {/* {viewMode && setViewMode && (
        <div className="px-2 hidden md:block">
          <div className="inline-flex rounded-md border">
            <button
              className={`px-3 py-1.5 text-sm inline-flex items-center gap-2 ${viewMode === "table" ? "bg-muted" : ""}`}
              onClick={() => setViewMode("table")}
              aria-label="Table view"
            >
              <TableIcon className="h-4 w-4" /> Table
            </button>
            <button
              className={`px-3 py-1.5 text-sm inline-flex items-center gap-2 border-l ${viewMode === "cards" ? "bg-muted" : ""}`}
              onClick={() => setViewMode("cards")}
              aria-label="Card view"
            >
              <LayoutGrid className="h-4 w-4" /> Cards
            </button>
          </div>
        </div>
      )} */}
      {tableName && (
        <div className="px-2">
          <Button
            variant="outline"
            size="sm"
            className="ml-auto hidden h-8 lg:flex"
            onClick={onExport}
          >
            <Download className="p-1" />
            Export
          </Button>
        </div>
      )}
      <div className="px-2">
        <Button
          variant="outline"
          size="sm"
          onClick={fetchRecords}
          className="ml-auto hidden h-8 lg:flex"
        >
          <RefreshCcw className="mr-2 h-4 w-4" /> Refresh
        </Button>
      </div>
      {table && <DataTableViewOptions table={table} />}
      {canCreate(userProfile, ResourceType.STUDENTS) && (
        <div className="pl-2">
          <Button
            variant="default"
            size="sm"
            className="ml-auto h-8"
            onClick={() => router.push("/students/add")}
          >
            <Plus className="mr-1 h-4 w-4" /> Add Student
          </Button>
        </div>
      )}
    </div>
  );
}
