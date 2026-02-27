"use client";
import { useState, useEffect, useCallback } from "react";

import { columnsCountries } from "@/components/data-table/columns/column-countries";
import { CountriesToolbar } from "@/components/data-table/toolbars/countries-toolbar";
import { DataTable } from "@/components/data-table/data-table";
import { countriesService } from "@/modules/countries/services/countries-service";
import { ZohoCountry } from "@/types/types";
import { useDebounce } from "@/hooks/use-debounce";

export default function CountriesManagementPage({ type }: { type: string }) {
  const [listCountries, setListCountries] = useState<ZohoCountry[]>([]);
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

  const fetchCountries = useCallback(async () => {
    setIsRefetching(true);
    try {
      const countriesResponse = await countriesService.getCountries({
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
      });

      setListCountries(countriesResponse.countries);
      setRecordCount(countriesResponse.totalCount);
    } catch (error) {
      console.error("Error fetching countries:", error);
    } finally {
      setIsRefetching(false);
    }
  }, [currentPage, pageSize, debouncedSearchTerm, sorting]);

  useEffect(() => {
    fetchCountries();
  }, [fetchCountries]);

  const handleGlobalFilterChange = (filter: string) => {
    if (!searchQuery && !filter) {
      setIsRefetching(true);
      fetchCountries();
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
        data={listCountries || []}
        toolbar={<CountriesToolbar fetchRecords={fetchCountries} type={type} />}
        columns={columnsCountries}
        onGlobalFilterChange={handleGlobalFilterChange}
        onSortingChange={handleSortingChange}
        onPageChange={handlePageChange}
        onPageSizeChange={handlePageSizeChange}
        pageSize={pageSize}
        currentPage={currentPage}
        loading={isRefetching}
        error={""}
        rowCount={recordCount}
        type="countries"
      />
    </div>
  );
}
