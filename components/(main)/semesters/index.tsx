"use client";
import { useState, useEffect, useCallback } from "react";

import { columnsSemesters } from "@/components/data-table/columns/column-semesters";
import { SemestersToolbar } from "@/components/data-table/toolbars/semesters-toolbar";
import { DataTable } from "@/components/data-table/data-table";
import { semestersService } from "@/modules/semesters/services/semesters-service";
import { ZohoSemester } from "@/types/types";
import { useDebounce } from "@/hooks/use-debounce";

export default function SemestersManagementPage({ type }: { type: string }) {
  const [listSemesters, setListSemesters] = useState<ZohoSemester[]>([]);
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

  const fetchSemesters = useCallback(async () => {
    setIsRefetching(true);
    try {
      const semestersResponse = await semestersService.getSemesters({
        page: currentPage,
        pageSize: pageSize,
        searchQuery: debouncedSearchTerm,
        orderBy: sorting,
      });

      setListSemesters(semestersResponse.semesters);
      setRecordCount(semestersResponse.totalCount);
    } catch (error) {
      console.error("Error fetching semesters:", error);
    } finally {
      setIsRefetching(false);
    }
  }, [currentPage, pageSize, debouncedSearchTerm, sorting]);

  useEffect(() => {
    fetchSemesters();
  }, [fetchSemesters]);

  const handleGlobalFilterChange = (filter: string) => {
    if (!searchQuery && !filter) {
      setIsRefetching(true);
      fetchSemesters();
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
        data={listSemesters || []}
        toolbar={<SemestersToolbar fetchRecords={fetchSemesters} type={type} />}
        columns={columnsSemesters}
        onGlobalFilterChange={handleGlobalFilterChange}
        onSortingChange={handleSortingChange}
        onPageChange={handlePageChange}
        onPageSizeChange={handlePageSizeChange}
        pageSize={pageSize}
        currentPage={currentPage}
        loading={isRefetching}
        error={""}
        rowCount={recordCount}
        type="semesters"
      />
    </div>
  );
}
