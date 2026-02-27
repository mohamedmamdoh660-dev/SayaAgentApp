"use client";
import { useState, useEffect } from "react";

import { getZohoDegreesColumns } from "@/components/data-table/columns/column-zoho-degrees";
import { ZohoDegreesDataTableToolbar } from "@/components/data-table/toolbars/zoho-degrees-toolbar";
import { DataTable } from "@/components/data-table/data-table";
import { zohoDegreesService } from "@/modules/zoho-degrees/services/zoho-degrees-service";
import { useDebounce } from "@/hooks/use-debounce";
import { ZohoDegree } from "@/types/types";

export default function ZohoDegreesManagementPage({ type }: { type: string }) {
  const [listDegrees, setListDegrees] = useState<ZohoDegree[]>([]);
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

  async function fetchDegrees() {
    setIsRefetching(true);
    try {
      const degreesResponse: any =
        await zohoDegreesService.getDegreesPagination(
          `%${debouncedSearchTerm}%`,
          pageSize,
          currentPage,
          sorting
        );

      setListDegrees(degreesResponse.degrees);
      setRecordCount(degreesResponse.totalCount);
    } catch (error) {
      console.error("Error fetching degrees:", error);
    } finally {
      setIsRefetching(false);
    }
  }

  useEffect(() => {
    fetchDegrees();
  }, [currentPage, pageSize, debouncedSearchTerm, sorting]);

  const handleGlobalFilterChange = (filter: string) => {
    if (!searchQuery && !filter) {
      setIsRefetching(true);
      fetchDegrees();
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
        data={listDegrees || []}
        toolbar={
          <ZohoDegreesDataTableToolbar
            fetchRecords={fetchDegrees}
            type={type}
          />
        }
        columns={getZohoDegreesColumns(fetchDegrees)}
        onGlobalFilterChange={handleGlobalFilterChange}
        onSortingChange={handleSortingChange}
        onPageChange={handlePageChange}
        onPageSizeChange={handlePageSizeChange}
        pageSize={pageSize}
        currentPage={currentPage}
        loading={isRefetching}
        error={""}
        rowCount={recordCount}
        type="zoho-degrees"
      />
    </div>
  );
}
