"use client";
import { useState, useEffect } from "react";

import { getZohoFacultyColumns } from "@/components/data-table/columns/column-zoho-faculty";
import { ZohoFacultyDataTableToolbar } from "@/components/data-table/toolbars/zoho-faculty-toolbar";
import { DataTable } from "@/components/data-table/data-table";

import { useDebounce } from "@/hooks/use-debounce";
import { ZohoFaculty } from "@/types/types";
import { zohoFacultyService } from "@/modules/zoho-faculty/services/zoho-faculty-service";

export default function ZohoFacultyManagementPage({ type }: { type: string }) {
  const [listFaculties, setListFaculties] = useState<ZohoFaculty[]>([]);
  const [recordCount, setRecordCount] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(0);
  const [pageSize, setPageSize] = useState<number>(12);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [isRefetching, setIsRefetching] = useState<boolean>(false);
  const debouncedSearchTerm = useDebounce(searchQuery, 500);
  const [sorting, setSorting] = useState<{
    sortBy?: string;
    sortOrder?: "asc" | "desc";
  }>({});

  async function fetchFaculties() {
    setIsRefetching(true);
    try {
      const facultiesResponse: any =
        await zohoFacultyService.getFacultiesPagination(
          `%${debouncedSearchTerm}%`,
          pageSize,
          currentPage,
          sorting
        );

      setListFaculties(facultiesResponse.faculties);
      setRecordCount(facultiesResponse.totalCount);
    } catch (error) {
      console.error("Error fetching faculties:", error);
    } finally {
      setIsRefetching(false);
    }
  }

  useEffect(() => {
    fetchFaculties();
  }, [currentPage, pageSize, debouncedSearchTerm, sorting]);

  const handleGlobalFilterChange = (filter: string) => {
    if (!searchQuery && !filter) {
      setIsRefetching(true);
      fetchFaculties();
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
    <div className="grid auto-rows-max items-start gap-4 md:gap-8 lg:col-span-2 ">
      <DataTable
        data={listFaculties || []}
        toolbar={
          <ZohoFacultyDataTableToolbar
            fetchRecords={fetchFaculties}
            type={type}
          />
        }
        columns={getZohoFacultyColumns(fetchFaculties)}
        onGlobalFilterChange={handleGlobalFilterChange}
        onSortingChange={handleSortingChange}
        onPageChange={handlePageChange}
        onPageSizeChange={handlePageSizeChange}
        pageSize={pageSize}
        currentPage={currentPage}
        loading={isRefetching}
        error={""}
        rowCount={recordCount}
        type="zoho-faculty"
      />
    </div>
  );
}
