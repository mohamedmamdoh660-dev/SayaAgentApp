"use client";
import { useState, useEffect } from "react";

import { getZohoSpecialityColumns } from "@/components/data-table/columns/column-zoho-speciality";
import { DataTable } from "@/components/data-table/data-table";

import { useDebounce } from "@/hooks/use-debounce";
import { ZohoSpeciality } from "@/types/types";
import { zohoSpecialityService } from "@/modules/zoho-speciality/services/zoho-speciality-service";
import { ZohoSpecialityDataTableToolbar } from "@/components/data-table/toolbars/zoho-speciality-toolbar";

export default function ZohoSpecialityManagementPage({
  type,
}: {
  type: string;
}) {
  const [listSpecialities, setListSpecialities] = useState<ZohoSpeciality[]>(
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

  async function fetchSpecialities() {
    setIsRefetching(true);
    try {
      const specialitiesResponse: any =
        await zohoSpecialityService.getSpecialitiesPagination(
          `%${debouncedSearchTerm}%`,
          pageSize,
          currentPage,
          sorting
        );

      setListSpecialities(specialitiesResponse.specialities);
      setRecordCount(specialitiesResponse.totalCount);
    } catch (error) {
      console.error("Error fetching specialities:", error);
    } finally {
      setIsRefetching(false);
    }
  }

  useEffect(() => {
    fetchSpecialities();
  }, [currentPage, pageSize, debouncedSearchTerm, sorting]);

  const handleGlobalFilterChange = (filter: string) => {
    if (!searchQuery && !filter) {
      setIsRefetching(true);
      fetchSpecialities();
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
        data={listSpecialities || []}
        toolbar={
          <ZohoSpecialityDataTableToolbar
            fetchRecords={fetchSpecialities}
            type={type}
          />
        }
        columns={getZohoSpecialityColumns(fetchSpecialities)}
        onGlobalFilterChange={handleGlobalFilterChange}
        onSortingChange={handleSortingChange}
        onPageChange={handlePageChange}
        onPageSizeChange={handlePageSizeChange}
        pageSize={pageSize}
        currentPage={currentPage}
        loading={isRefetching}
        error={""}
        rowCount={recordCount}
        type="zoho-speciality"
      />
    </div>
  );
}
