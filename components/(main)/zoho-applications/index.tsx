"use client";
import { useState, useEffect, useCallback } from "react";

import { getZohoApplicationsColumns } from "@/components/data-table/columns/column-zoho-applications";
import { ZohoApplicationsDataTableToolbar } from "@/components/data-table/toolbars/zoho-applications-toolbar";
import { DataTable } from "@/components/data-table/data-table";
import { DataTablePagination } from "@/components/data-table/data-table-pagination";
import { ResourceType, ZohoApplication } from "@/types/types";
import { useDebounce } from "@/hooks/use-debounce";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { getApplicationsPagination } from "@/supabase/actions/db-actions";

import { LayoutGrid } from "lucide-react";
import InfoGraphic from "@/components/ui/info-graphic";
import { supabaseClient } from "@/lib/supabase-auth-client";

import { ZohoApplicationsCards } from "./component/applications-cards";
import Loader from "@/components/loader";
import { toast } from "sonner";
import { canViewAll } from "@/lib/permissions";

export default function ZohoApplicationsManagementPage({
  type,
}: {
  type: string;
}) {
  const [listApplications, setListApplications] = useState<ZohoApplication[]>(
    []
  );
  const [recordCount, setRecordCount] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(0);
  const [pageSize, setPageSize] = useState<number>(12);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [isRefetching, setIsRefetching] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<"table" | "cards">("table");
  const debouncedSearchTerm = useDebounce(searchQuery, 500);
  const { userProfile } = useAuth();

  const router = useRouter();
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [sorting, setSorting] = useState<{
    sortBy?: string;
    sortOrder?: "asc" | "desc";
  }>({});

  const [applicationDownloading, setApplicationDownloading] = useState({
    id: "",
    name: "",
  });

  const fetchApplications = useCallback(
    async ({ resetPagination = false }: { resetPagination?: boolean } = {}) => {
      setIsRefetching(true);
      try {
        const recordPermission = canViewAll(
          userProfile,
          ResourceType.APPLICATIONS
        );
        const applicationsResponse: any = await getApplicationsPagination(
          `${debouncedSearchTerm}`,
          pageSize,
          resetPagination ? 0 : currentPage,
          userProfile?.id || "",
          userProfile?.roles?.name || "",
          userProfile?.agency_id || "",
          filters,
          sorting,
          recordPermission
        );

        if (resetPagination) {
          setCurrentPage(0);
        }

        setListApplications(applicationsResponse.applications);
        setRecordCount(applicationsResponse.totalCount);
      } catch (error) {
        console.error("Error fetching applications:", error);
      } finally {
        setIsRefetching(false);
      }
    },
    [
      debouncedSearchTerm,
      pageSize,
      currentPage,
      userProfile?.id,
      userProfile?.roles?.name,
      userProfile?.agency_id,
      filters,
      sorting,
    ]
  );

  useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);

  // Realtime list updates for applications table
  useEffect(() => {
    const channel = supabaseClient
      .channel("rt-applications-list")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "zoho_applications" },
        (payload) => {
          if (payload.eventType === "INSERT") {
            if (payload.new.user_id === userProfile?.id) {
              fetchApplications({ resetPagination: true });
              toast.success(
                `${payload?.new?.application_name || "New application"} has been added successfully`
              );
            }
          } else if (payload.eventType === "UPDATE") {
            if (
              listApplications.find(
                (application) => application.id === payload.new.id
              ) &&
              payload.new.user_id === userProfile?.id
            ) {
              toast.success(
                `${payload?.new?.application_name} has been updated successfully`
              );
            }
          }
        }
      )
      .subscribe();
    return () => {
      try {
        supabaseClient.removeChannel(channel);
      } catch {}
    };
  }, [fetchApplications]);

  const handleGlobalFilterChange = (filter: string) => {
    if (!searchQuery && !filter) {
      setIsRefetching(true);
      fetchApplications();
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
      {viewMode === "table" ? (
        <DataTable
          data={listApplications || []}
          toolbar={
            <ZohoApplicationsDataTableToolbar
              fetchRecords={fetchApplications}
              type={type}
              viewMode={viewMode}
              setViewMode={setViewMode}
              onFiltersChange={(f) => {
                setFilters(f);
                setCurrentPage(0);
              }}
              filters={filters}
            />
          }
          columns={getZohoApplicationsColumns(
            fetchApplications,
            router,
            applicationDownloading,
            setApplicationDownloading
          )}
          onGlobalFilterChange={handleGlobalFilterChange}
          onPageChange={handlePageChange}
          onPageSizeChange={handlePageSizeChange}
          onSortingChange={handleSortingChange}
          pageSize={pageSize}
          currentPage={currentPage}
          loading={isRefetching}
          error={""}
          rowCount={recordCount}
          type="zoho-applications"
        />
      ) : (
        <>
          <ZohoApplicationsDataTableToolbar
            fetchRecords={fetchApplications}
            type={type}
            onGlobalFilterChange={handleGlobalFilterChange}
            onFiltersChange={(f) => {
              setFilters(f);
              setCurrentPage(0);
            }}
            viewMode={viewMode}
            setViewMode={setViewMode}
          />
          {isRefetching ? (
            <div className="h-[calc(100vh-200px)] flex justify-center items-center">
              <Loader />
            </div>
          ) : (listApplications || []).length === 0 ? (
            <div className="h-[500px]">
              <InfoGraphic
                icon={<LayoutGrid className="h-16 w-16 text-primary" />}
                title="No applications found"
                description="Try adjusting your search or filters, or add a new application."
                isLeftArrow={false}
                gradient={false}
              />
            </div>
          ) : (
            <ZohoApplicationsCards
              applications={listApplications || []}
              router={router}
              applicationDownloading={applicationDownloading}
              setApplicationDownloading={setApplicationDownloading}
            />
          )}

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
  );
}
