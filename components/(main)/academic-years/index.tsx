"use client";
import { useState, useEffect, useCallback } from "react";

import { columnsAcademicYears } from "@/components/data-table/columns/column-academic-years";
import { AcademicYearsToolbar } from "@/components/data-table/toolbars/academic-years-toolbar";
import { DataTable } from "@/components/data-table/data-table";
import { academicYearsService } from "@/modules/academic-years/services/academic-years-service";
import { ZohoAcademicYear } from "@/types/types";
import { useDebounce } from "@/hooks/use-debounce";

export default function AcademicYearsManagementPage({
  type,
}: {
  type: string;
}) {
  const [listAcademicYears, setListAcademicYears] = useState<
    ZohoAcademicYear[]
  >([]);
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

  const fetchAcademicYears = useCallback(async () => {
    setIsRefetching(true);
    try {
      const academicYearsResponse = await academicYearsService.getAcademicYears(
        {
          page: currentPage,
          pageSize: pageSize,
          searchQuery: debouncedSearchTerm,
          orderBy:
            Object.keys(sorting || {}).length > 0
              ? [
                  {
                    [sorting?.sortBy || "created_at"]:
                      sorting.sortOrder === "asc"
                        ? "AscNullsLast"
                        : "DescNullsLast",
                  },
                ]
              : [{ name: "AscNullsLast" }],
        }
      );

      setListAcademicYears(academicYearsResponse.academicYears);
      setRecordCount(academicYearsResponse.totalCount);
    } catch (error) {
      console.error("Error fetching academic years:", error);
    } finally {
      setIsRefetching(false);
    }
  }, [currentPage, pageSize, debouncedSearchTerm, sorting]);

  useEffect(() => {
    fetchAcademicYears();
  }, [fetchAcademicYears]);

  const handleGlobalFilterChange = (filter: string) => {
    if (!searchQuery && !filter) {
      setIsRefetching(true);
      fetchAcademicYears();
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
        data={listAcademicYears || []}
        toolbar={
          <AcademicYearsToolbar fetchRecords={fetchAcademicYears} type={type} />
        }
        columns={columnsAcademicYears}
        onGlobalFilterChange={handleGlobalFilterChange}
        onSortingChange={handleSortingChange}
        onPageChange={handlePageChange}
        onPageSizeChange={handlePageSizeChange}
        pageSize={pageSize}
        currentPage={currentPage}
        loading={isRefetching}
        error={""}
        rowCount={recordCount}
        type="academic-years"
      />
    </div>
  );
}
