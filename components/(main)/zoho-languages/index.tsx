"use client";
import { useState, useEffect } from "react";

import { getZohoLanguagesColumns } from "@/components/data-table/columns/column-zoho-languages";
import { ZohoLanguagesDataTableToolbar } from "@/components/data-table/toolbars/zoho-languages-toolbar";
import { DataTable } from "@/components/data-table/data-table";
import { zohoLanguagesService } from "@/modules/zoho-languages/services/zoho-languages-service";
import { ZohoLanguage } from "@/types/types";
import { useDebounce } from "@/hooks/use-debounce";

export default function ZohoLanguagesManagementPage({
  type,
}: {
  type: string;
}) {
  const [listLanguages, setListLanguages] = useState<ZohoLanguage[]>([]);
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

  async function fetchLanguages() {
    setIsRefetching(true);
    try {
      const languagesResponse: any =
        await zohoLanguagesService.getLanguagesPagination(
          `%${debouncedSearchTerm}%`,
          pageSize,
          currentPage,
          sorting
        );

      setListLanguages(languagesResponse.languages);
      setRecordCount(languagesResponse.totalCount);
    } catch (error) {
      console.error("Error fetching languages:", error);
    } finally {
      setIsRefetching(false);
    }
  }

  useEffect(() => {
    fetchLanguages();
  }, [currentPage, pageSize, debouncedSearchTerm, sorting]);

  const handleGlobalFilterChange = (filter: string) => {
    if (!searchQuery && !filter) {
      setIsRefetching(true);
      fetchLanguages();
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
        data={listLanguages || []}
        toolbar={
          <ZohoLanguagesDataTableToolbar
            fetchRecords={fetchLanguages}
            type={type}
          />
        }
        columns={getZohoLanguagesColumns(fetchLanguages)}
        onGlobalFilterChange={handleGlobalFilterChange}
        onSortingChange={handleSortingChange}
        onPageChange={handlePageChange}
        onPageSizeChange={handlePageSizeChange}
        pageSize={pageSize}
        currentPage={currentPage}
        loading={isRefetching}
        error={""}
        rowCount={recordCount}
        type="zoho-languages"
      />
    </div>
  );
}
