"use client";
import { useState, useEffect, useCallback } from "react";

import { getUniversitiesColumns } from "@/components/data-table/columns/column-universities";
import { UniversitiesToolbar } from "@/components/data-table/toolbars/universities-toolbar";
import { DataTable } from "@/components/data-table/data-table";
import { universitiesService } from "@/modules/universities/services/universities-service";
import { ZohoUniversity } from "@/types/types";
import { useDebounce } from "@/hooks/use-debounce";
import { useRouter } from "next/navigation";

export default function UniversitiesManagementPage({ type }: { type: string }) {
  const router = useRouter();
  const [listUniversities, setListUniversities] = useState<ZohoUniversity[]>(
    []
  );
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

  const fetchUniversities = useCallback(async () => {
    setIsRefetching(true);
    try {
      const universitiesResponse = await universitiesService.getUniversities({
        page: currentPage,
        pageSize: pageSize,
        searchQuery: debouncedSearchTerm,
        orderBy: sorting,
      });

      setListUniversities(universitiesResponse.universities);
      setRecordCount(universitiesResponse.totalCount);
    } catch (error) {
      console.error("Error fetching universities:", error);
    } finally {
      setIsRefetching(false);
    }
  }, [currentPage, pageSize, debouncedSearchTerm, sorting]);

  useEffect(() => {
    fetchUniversities();
  }, [fetchUniversities]);

  const handleGlobalFilterChange = (filter: string) => {
    if (!searchQuery && !filter) {
      setIsRefetching(true);
      fetchUniversities();
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
        data={listUniversities || []}
        toolbar={
          <UniversitiesToolbar fetchRecords={fetchUniversities} type={type} />
        }
        columns={getUniversitiesColumns(router)}
        onGlobalFilterChange={handleGlobalFilterChange}
        onSortingChange={handleSortingChange}
        onPageChange={handlePageChange}
        onPageSizeChange={handlePageSizeChange}
        pageSize={pageSize}
        currentPage={currentPage}
        loading={isRefetching}
        error={""}
        rowCount={recordCount}
        type="universities"
      />
    </div>
  );
}
