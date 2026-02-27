"use client";
import { useState, useEffect } from "react";

import { getRoleColumns } from "@/components/data-table/columns/column-role";
import { DataTable } from "@/components/data-table/data-table";
import { rolesService } from "@/modules/roles";
import { Role } from "@/modules/roles";
import { useDebounce } from "@/hooks/use-debounce";
import { RoleDataTableToolbar } from "@/components/data-table/toolbars/role-toolbar";

export default function RoleManagementPage({ type }: { type: string }) {
  const [listRoles, setListRoles] = useState<Role[]>([]);
  const [filteredRoles, setFilteredRoles] = useState<Role[]>([]);
  const [isRefetching, setIsRefetching] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const debouncedSearchTerm = useDebounce(searchQuery, 500);

  async function fetchRoles() {
    setIsRefetching(true);
    try {
      const response = await rolesService.getPaginatedRoles("", 0, 100);
      setListRoles(response.roles);
      setFilteredRoles(response.roles);
    } catch (error) {
      console.error("Error fetching roles:", error);
    } finally {
      setIsRefetching(false);
    }
  }

  useEffect(() => {
    fetchRoles();
  }, []);

  useEffect(() => {
    if (debouncedSearchTerm) {
      const filtered = listRoles.filter(
        (role) =>
          role.name.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
          (role.description &&
            role.description
              .toLowerCase()
              .includes(debouncedSearchTerm.toLowerCase()))
      );
      setFilteredRoles(filtered);
    } else {
      setFilteredRoles(listRoles);
    }
  }, [debouncedSearchTerm, listRoles]);

  const handleGlobalFilterChange = (filter: string) => {
    setSearchQuery(filter);
  };

  return (
    <div>
      <DataTable
        data={filteredRoles || []}
        toolbar={
          <RoleDataTableToolbar
            fetchRecords={fetchRoles}
            type={type}
            onGlobalFilterChange={handleGlobalFilterChange}
          />
        }
        // @ts-ignore
        columns={getRoleColumns(fetchRoles)}
        onGlobalFilterChange={handleGlobalFilterChange}
        onPageChange={() => {}}
        onPageSizeChange={() => {}}
        pageSize={filteredRoles.length}
        currentPage={0}
        loading={isRefetching}
        pagination={false}
        error={""}
        rowCount={filteredRoles.length}
        type="roles"
      />
    </div>
  );
}
