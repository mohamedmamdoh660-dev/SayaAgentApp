"use client";
import { useState, useEffect, useCallback } from "react";

import { getZohoProgramsColumns } from "@/components/data-table/columns/column-zoho-programs";
import { ZohoProgramsDataTableToolbar } from "@/components/data-table/toolbars/zoho-programs-toolbar";
import { DataTable } from "@/components/data-table/data-table";
import { zohoProgramsService } from "@/modules/zoho-programs/services/zoho-programs-service";
import { ZohoProgram } from "@/types/types";
import { useDebounce } from "@/hooks/use-debounce";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { ZohoProgramsCards } from "./component/programs-cards";
import { DataTablePagination } from "@/components/data-table/data-table-pagination";
import { LayoutGrid } from "lucide-react";
import InfoGraphic from "@/components/ui/info-graphic";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import Loader from "@/components/loader";
import { getProgramsPagination } from "@/supabase/actions/db-actions";

export default function ZohoProgramsManagementPage({ type }: { type: string }) {
  const [listPrograms, setListPrograms] = useState<ZohoProgram[]>([]);
  const [recordCount, setRecordCount] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(0);
  const [pageSize, setPageSize] = useState<number>(12);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [isRefetching, setIsRefetching] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<"table" | "cards">("table");
  const debouncedSearchTerm = useDebounce(searchQuery, 500);
  const [filters, setFilters] = useState<Record<string, string>>({});
  const router = useRouter();
  const [globalFilter, setGlobalFilter] = useState<string>("");
  const [sorting, setSorting] = useState<{
    sortBy?: string;
    sortOrder?: "asc" | "desc";
  }>({});
  async function fetchPrograms() {
    setIsRefetching(true);
    try {
      const programsResponse: any = await getProgramsPagination(
        `%${debouncedSearchTerm}%`,
        pageSize,
        currentPage * pageSize,
        filters,
        sorting
      );

      setListPrograms(programsResponse.programs);
      setRecordCount(programsResponse.totalCount);
    } catch (error) {
      console.error("Error fetching programs:", error);
    } finally {
      setIsRefetching(false);
    }
  }

  useEffect(() => {
    fetchPrograms();
  }, [currentPage, pageSize, debouncedSearchTerm, filters, sorting]);

  const handleGlobalFilterChange = (filter: string) => {
    if (!searchQuery && !filter) {
      setIsRefetching(true);
      fetchPrograms();
    } else {
      setSearchQuery(filter);
    }
    setCurrentPage(0);
  };

  const handlePageChange = (pageIndex: number) => {
    setCurrentPage(pageIndex);
  };

  const handlePageSizeChange = (size: number) => {
    setPageSize(size);
    setCurrentPage(0);
  };

  const handleSortingChange = (sortBy?: string, sortOrder?: "asc" | "desc") => {
    setSorting({ sortBy, sortOrder });
    setCurrentPage(0);
  };

  return (
    <div>
      {viewMode === "table" ? (
        <div className="grid auto-rows-max items-start gap-4 md:gap-8 lg:col-span-2 ">
          <DataTable
            data={listPrograms || []}
            toolbar={
              <ZohoProgramsDataTableToolbar
                fetchRecords={fetchPrograms}
                type={type}
                onFiltersChange={(f) => {
                  setFilters(f);
                  setCurrentPage(0);
                }}
                filters={filters}
                // @ts-ignore - add view controls in the toolbar if needed later
                viewMode={viewMode}
                // @ts-ignore
                setViewMode={setViewMode}
                globalFilter={globalFilter}
                setGlobalFilter={setGlobalFilter}
              />
            }
            columns={getZohoProgramsColumns(fetchPrograms, router)}
            onGlobalFilterChange={handleGlobalFilterChange}
            onPageChange={handlePageChange}
            onPageSizeChange={handlePageSizeChange}
            onSortingChange={handleSortingChange}
            pageSize={pageSize}
            currentPage={currentPage}
            loading={isRefetching}
            error={""}
            rowCount={recordCount}
            type="zoho-programs"
          />
        </div>
      ) : (
        <div className="">
          <ZohoProgramsDataTableToolbar
            fetchRecords={fetchPrograms}
            type={type}
            onFiltersChange={(f) => {
              setFilters(f);
              setCurrentPage(0);
            }}
            onGlobalFilterChange={handleGlobalFilterChange}
            filters={filters}
            // @ts-ignore
            viewMode={viewMode}
            // @ts-ignore
            setViewMode={setViewMode}
            globalFilter={globalFilter}
            setGlobalFilter={setGlobalFilter}
          />
          <div className="mt-4">
            {isRefetching ? (
              <div className="h-[calc(100vh-200px)] flex justify-center items-center">
                <Loader />
              </div>
            ) : (listPrograms || []).length === 0 ? (
              <div className="h-[500px]">
                <InfoGraphic
                  icon={<LayoutGrid className="h-16 w-16 text-primary" />}
                  title="No programs found"
                  description="Try adjusting your search or filters, or add a new program."
                  isLeftArrow={false}
                  gradient={false}
                />
              </div>
            ) : (
              <>
                <ZohoProgramsCards
                  programs={listPrograms || []}
                  router={router}
                />
                <DataTablePagination
                  table={{} as any}
                  pageIndex={currentPage}
                  pageSize={pageSize}
                  onPageChange={handlePageChange}
                  onPageSizeChange={handlePageSizeChange}
                  rowCount={recordCount}
                />
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
