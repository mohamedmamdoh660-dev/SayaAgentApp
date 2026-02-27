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
  ListFilterPlus,
} from "lucide-react";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import AddZohoApplication from "@/components/(main)/zoho-applications/component/add-zoho-application";
import { useAuth } from "@/context/AuthContext";

import { SearchableDropdown } from "@/components/searchable-dropdown";
import { useClearLocationSelections } from "@/context/SearchableDropdownContext";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { ResourceType } from "@/types/types";
import { canCreate } from "@/lib/permissions";

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
}

export function ZohoApplicationsDataTableToolbar<TData>({
  table,
  onRefresh,
  onExport,
  tableName,
  onGlobalFilterChange,
  fetchRecords,
  type,
  viewMode,
  setViewMode,
  onFiltersChange,
  filters = {},
}: DataTableToolbarProps<TData>) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [globalFilter, setGlobalFilter] = useState<string>("");
  const [openFilters, setOpenFilters] = useState(false);

  // Local filter state mirrors add-zoho-application form fields
  const [student, setStudent] = useState(filters.student || "");
  const [program, setProgram] = useState(filters.program || "");
  const [acdamic_year, setAcademicYear] = useState(filters.acdamic_year || "");
  const [semester, setSemester] = useState(filters.semester || "");
  const [country, setCountry] = useState(filters.country || "");
  const [university, setUniversity] = useState(filters.university || "");
  const [degree, setDegree] = useState(filters.degree || "");
  // stage filtering is handled via the global search input
  const activeCount = Object.keys(filters || {}).length;

  const handleFilterChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setGlobalFilter(value);
    onGlobalFilterChange?.(value);
  };
  const { userProfile } = useAuth();
  const isCrmId = userProfile?.crm_id || userProfile?.agency?.crm_id;
  const clearLocationSelections = useClearLocationSelections();
  const LOCATION = "applications-toolbar";

  const isFiltered = globalFilter !== "";

  return (
    <div className="flex items-center justify-between">
      <div className="flex flex-1 items-center space-x-2">
        <div className="relative w-1/2">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by Program, Application, Student or Stage"
            value={globalFilter}
            onChange={handleFilterChange}
            className="h-8 pl-8 w-full focus-visible:ring-0"
          />
        </div>

        <Popover open={openFilters} onOpenChange={setOpenFilters}>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="h-8">
              <ListFilterPlus className="mr-2 h-4 w-4" /> Advanced Filters
              {activeCount > 0 && (
                <Badge
                  className="ml-2 h-5 px-1 text-[10px]"
                  variant="secondary"
                >
                  {activeCount}
                </Badge>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[720px] p-4" align="start">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <SearchableDropdown
                placeholder="Student"
                table="zoho-students"
                searchField="first_name"
                displayField="first_name"
                displayField2="last_name"
                initialValue={student}
                location={LOCATION}
                onSelect={(it: any) => setStudent(it?.id || "")}
              />
              <SearchableDropdown
                placeholder="Academic Year"
                table="zoho-academic-years"
                searchField="name"
                displayField="name"
                initialValue={acdamic_year}
                location={LOCATION}
                onSelect={(it: any) => setAcademicYear(it?.id || "")}
              />
              <SearchableDropdown
                placeholder="Degree"
                table="zoho-degrees"
                searchField="name"
                displayField="name"
                initialValue={degree}
                location={LOCATION}
                onSelect={(it: any) => {
                  setDegree(it?.id || "");
                  setProgram("");
                }}
              />
              <SearchableDropdown
                placeholder="Country"
                table="zoho-countries"
                searchField="name"
                displayField="name"
                initialValue={country}
                location={LOCATION}
                onSelect={(it: any) => setCountry(it?.id || "")}
              />
              <SearchableDropdown
                placeholder="Semester"
                table="zoho-semesters"
                searchField="name"
                displayField="name"
                initialValue={semester}
                location={LOCATION}
                onSelect={(it: any) => setSemester(it?.id || "")}
              />
              <SearchableDropdown
                placeholder="University"
                table="zoho-universities"
                searchField="name"
                displayField="name"
                dependsOn={[{ field: "country", value: country || null }]}
                disabled={!country}
                initialValue={university}
                location={LOCATION}
                onSelect={(it: any) => {
                  setUniversity(it?.id || "");
                  setProgram("");
                }}
              />

              <SearchableDropdown
                placeholder="Program"
                table="zoho-programs"
                searchField="name"
                displayField="name"
                dependsOn={[
                  { field: "university_id", value: university || null },
                  { field: "country_id", value: country || null },
                  { field: "degree_id", value: degree || null },
                ]}
                disabled={!university || !country || !degree}
                initialValue={program}
                location={LOCATION}
                onSelect={(it: any) => setProgram(it?.id || "")}
              />
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setStudent("");
                  setProgram("");
                  setAcademicYear("");
                  setSemester("");
                  setCountry("");
                  setUniversity("");
                  setDegree("");
                  clearLocationSelections(LOCATION);
                  onFiltersChange?.({});
                }}
              >
                Clear
              </Button>
              <Button
                size="sm"
                onClick={() => {
                  const next = {
                    student,
                    program,
                    acdamic_year,
                    semester,
                    country,
                    university,
                    degree,
                  } as Record<string, string>;
                  // remove empty
                  Object.keys(next).forEach((k) => {
                    if (!next[k]) delete next[k];
                  });
                  onFiltersChange?.(next);
                  setOpenFilters(false);
                }}
              >
                Apply Filters
              </Button>
            </div>
          </PopoverContent>
        </Popover>
        {(activeCount > 0 || isFiltered) && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setStudent("");
              setProgram("");
              setAcademicYear("");
              setSemester("");
              setCountry("");
              setUniversity("");
              setDegree("");
              setGlobalFilter("");
              onGlobalFilterChange?.("");
              clearLocationSelections(LOCATION);
              onFiltersChange?.({});
            }}
            className="h-8 px-2"
          >
            Clear Search
            <X className="ml-2 h-4 w-4" />
          </Button>
        )}
      </div>

      {/* <ToggleGroup
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
      </ToggleGroup> */}
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
      <div className="px-2 flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={fetchRecords}
          className="ml-auto hidden h-8 lg:flex"
        >
          <RefreshCcw className="mr-2 h-4 w-4" /> Refresh
        </Button>
        {/* {

        }
        <Button
          variant="outline"
          size="sm"
          className="hidden h-8 lg:flex"
          onClick={() => setAttachOpen(true)}
        >
          <Upload className="mr-2 h-4 w-4" /> Upload Missing
        </Button> */}
      </div>
      {table && <DataTableViewOptions table={table} />}
      {canCreate(userProfile, ResourceType.APPLICATIONS) && (
        <>
          <div className="pl-2">
            <Button
              variant="default"
              size="sm"
              className="ml-auto h-8"
              onClick={() => setIsDialogOpen(true)}
            >
              <Plus className="mr-1 h-4 w-4" /> Add Application
            </Button>
          </div>
          <AddZohoApplication
            open={isDialogOpen}
            onOpenChange={setIsDialogOpen}
            onRefresh={fetchRecords}
          />
          {/* <DocumentAttachmentDialog
            open={attachOpen}
            onOpenChange={setAttachOpen}
          /> */}
        </>
      )}
    </div>
  );
}
