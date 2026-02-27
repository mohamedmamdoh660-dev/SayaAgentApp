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
  ListFilterPlus,
} from "lucide-react";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import AddZohoProgram from "@/components/(main)/zoho-programs/component/add-zoho-program";
import { useAuth } from "@/context/AuthContext";
import { SearchableDropdown } from "@/components/searchable-dropdown";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import ProgramsExportDialog, {
  ExportFormat,
} from "@/components/(main)/zoho-programs/component/programs-export-dialog";
import ProgramsFilters from "@/components/(main)/zoho-programs/component/programs-filters";
import { useClearLocationSelections } from "@/context/SearchableDropdownContext";
import { exportProgramsToPDF } from "@/components/(main)/zoho-programs/component/programs-pdf";
import { getProgramsAll } from "@/supabase/actions/db-actions";
import { generateNameAvatar } from "@/utils/generateRandomAvatar";
import { ResourceType } from "@/types/types";
import { canExport } from "@/lib/permissions";
// PDF libs will be loaded dynamically when exporting to reduce bundle size

interface DataTableToolbarProps<TData> {
  table?: Table<TData>;
  onRefresh?: () => void;
  onExport?: () => void;
  tableName?: string;
  onGlobalFilterChange?: (value: string) => void;
  fetchRecords: () => void;
  type?: string;
  viewMode: "table" | "cards";
  setViewMode: (viewMode: "table" | "cards") => void;
  onFiltersChange?: (filters: Record<string, string>) => void;
  filters?: Record<string, string>;
  globalFilter?: string;
  setGlobalFilter?: (value: string) => void;
}

export function ZohoProgramsDataTableToolbar<TData>({
  table,
  onRefresh,
  onExport,
  tableName,
  onGlobalFilterChange,
  fetchRecords,
  type,
  onFiltersChange,
  filters = {},
  viewMode,
  setViewMode,
  globalFilter,
  setGlobalFilter,
}: DataTableToolbarProps<TData>) {
  const [openExport, setOpenExport] = useState(false);
  const clearLocationSelections = useClearLocationSelections();
  const LOCATION = "programs-toolbar";
  const [clearFilters, setClearFilters] = useState(false);
  const handleFilterChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setGlobalFilter?.(value);
    onGlobalFilterChange?.(value);
  };

  const isFiltered = globalFilter !== "";
  const activeCount = Object.keys(filters || {}).length;
  const { userProfile } = useAuth();

  return (
    <div className="flex items-center justify-between">
      <div className="flex flex-1 items-center space-x-2">
        <div className="relative w-1/2">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by Program Name"
            value={globalFilter}
            onChange={handleFilterChange}
            className="h-8 pl-8 w-full focus-visible:ring-0"
          />
        </div>

        <ProgramsFilters
          filters={filters}
          onFiltersChange={(f) => {
            onFiltersChange?.(f);
          }}
          clearFilters={clearFilters}
          setClearFilters={setClearFilters}
        />
        {(activeCount > 0 || isFiltered) && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setGlobalFilter?.("");
              onGlobalFilterChange?.("");
              clearLocationSelections(LOCATION);
              onFiltersChange?.({});
              setClearFilters(true);
            }}
            className="h-8 px-2"
          >
            Clear Search
            <X className="ml-2 h-4 w-4" />
          </Button>
        )}
      </div>
      <ToggleGroup
        type="single"
        value={viewMode}
        onValueChange={(v) => v && setViewMode(v as any)}
        variant="outline"
        className="hidden md:flex"
      >
        <ToggleGroupItem
          value="table"
          aria-label="Table view"
          className="gap-2 h-8"
        >
          <TableIcon className="h-4 w-4" />
        </ToggleGroupItem>
        <ToggleGroupItem
          value="cards"
          aria-label="Card view"
          className="gap-2 h-8"
        >
          <LayoutGrid className="h-4 w-4" />
        </ToggleGroupItem>
      </ToggleGroup>
      {canExport(userProfile, ResourceType.PROGRAMS) && (
        <div className="pl-2">
          <Button
            variant="outline"
            size="sm"
            className="ml-auto hidden h-8 lg:flex"
            onClick={() => setOpenExport(true)}
          >
            <Download className="mr-2 h-4 w-4" />
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
      <ProgramsExportDialog
        open={openExport}
        onOpenChange={setOpenExport}
        globalFilter={globalFilter}
        filters={filters}
        table={table}
        setOpenExport={setOpenExport}
      />
      {/* {userProfile?.roles?.name === "admin" && (
        <div className="pl-2">
          <Button
            variant="default"
            size="sm"
            className="ml-auto h-8"
            onClick={() => setIsDialogOpen(true)}
          >
            <Plus className="mr-1 h-4 w-4" /> Add Program
          </Button>
        </div>
      )} */}
      {/* <AddZohoProgram
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onRefresh={fetchRecords}
      /> */}
    </div>
  );
}
