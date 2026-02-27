"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table } from "@tanstack/react-table";
import { X, Plus, RefreshCcw, Search } from "lucide-react";
import { useState } from "react";
import { DataTableViewOptions } from "@/components/data-table/data-table-view-options";
import AddUniversity from "@/components/(main)/universities/component/add-university";

interface UniversitiesToolbarProps<TData> {
  table?: Table<TData>;
  onRefresh?: () => void;
  onExport?: () => void;
  tableName?: string;
  onGlobalFilterChange?: (value: string) => void;
  fetchRecords?: () => void;
  type?: string;
}

export function UniversitiesToolbar<TData>({
  table,
  onRefresh,
  onExport,
  tableName,
  onGlobalFilterChange,
  fetchRecords,
  type,
}: UniversitiesToolbarProps<TData>) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [globalFilter, setGlobalFilter] = useState<string>("");

  const handleFilterChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setGlobalFilter(value);
    onGlobalFilterChange?.(value);
  };

  const isFiltered = globalFilter !== "";

  return (
    <div className="flex items-center justify-between">
      <div className="flex flex-1 items-center space-x-2">
        <div className="relative w-1/2">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by Name..."
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
      <div className="flex items-center space-x-2">
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
        {table && <DataTableViewOptions table={table} />}{" "}
        {/* <Button size="sm" onClick={() => setIsDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> Add University
        </Button> */}
      </div>

      {/* Add university dialog */}
      {/* <AddUniversity
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onRefresh={onRefresh}
      /> */}
    </div>
  );
}
